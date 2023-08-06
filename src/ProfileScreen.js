import React, { useState } from "react";
import type { Node } from "react";
import { Alert, TextInput, ActivityIndicator, Pressable, Button, Image, StyleSheet, Text, SafeAreaView, View, FlatList } from "react-native";
import { NavigationContainer } from "@react-navigation/native";

import { keys } from "./Constants";
import { useEpilogueStyle } from './hooks/useEpilogueStyle';
import epilogueStorage from "./Storage";

export function ProfileScreen({ navigation }) {
	const styles = useEpilogueStyle()
	const [ username, setUsername ] = useState("");
	const [ hostname, setHostname ] = useState("Micro.blog");
	const [ posts, setPosts ] = useState([]);
	
	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			onFocus(navigation);
		});
		return unsubscribe;
	}, [navigation]);	
	
	function onFocus(navigation) {
		setupSignOutButton();
		loadPosts();
		
		epilogueStorage.get(keys.currentUsername).then(current_username => {
			setUsername(current_username);
		});

		epilogueStorage.get(keys.micropubURL).then(micropub_url => {
			if ((micropub_url == undefined) || micropub_url.includes("micro.blog")) {
				setHostname("Micro.blog");
			}
			else {
				let pieces = micropub_url.split("/");
				let hostname = pieces[2];
				setHostname(hostname);
			}
		});
	}

	function loadPosts() {
		epilogueStorage.get(keys.authToken).then(auth_token => {
			var use_token = auth_token;
			epilogueStorage.get(keys.micropubToken).then(micropub_token => {
				if (micropub_token != undefined) {
					use_token = micropub_token;
				}
	
				var options = {
					headers: {
						"Authorization": "Bearer " + use_token
					}
				};
	
				epilogueStorage.get(keys.micropubURL).then(micropub_url => {
					var use_url = micropub_url;
					if (use_url == undefined) {
						use_url = "https://micro.blog/micropub";
					}
					
					if (use_url.includes("?")) {
						use_url = use_url + "&q=source";
					}
					else {
						use_url = use_url + "?q=source";
					}
					
					fetch(use_url, options).then(response => response.json()).then(data => {
						var new_items = [];

						for (let item of data.items) {
							const text = item.properties.content[0];
							if (text.includes("micro.blog/books/")) {
								new_items.push({
									id: item.properties.uid[0],
									text: item.properties.content[0]
								});
							}
						}

						setPosts(new_items);
					});
				});
			});
		});
	}
	
	function onChangePressed() {
		navigation.navigate("External");
	}

	function onSignOut() {		
		Alert.alert("Sign out of Epilogue?", "", [
		  {
			text: "Cancel",
			style: "cancel"
		  },
		  {
			text: "Sign Out",
			onPress: () => {
			  clearSettings();
			  navigation.goBack();
			}
		  }
		]);
	}
	  
	function clearSettings() {
		epilogueStorage.remove(keys.authToken);
		epilogueStorage.remove(keys.currentUsername);		
		epilogueStorage.remove(keys.currentBlogID);
		epilogueStorage.remove(keys.currentBlogName);
		epilogueStorage.remove(keys.currentBookshelf);
		epilogueStorage.remove(keys.currentSearch);
		epilogueStorage.remove(keys.allBookshelves);
		epilogueStorage.remove(keys.meURL);
		epilogueStorage.remove(keys.authState);
		epilogueStorage.remove(keys.authURL);
		epilogueStorage.remove(keys.tokenURL);
		epilogueStorage.remove(keys.micropubURL);
		epilogueStorage.remove(keys.micropubToken);
		epilogueStorage.remove(keys.lastMicropubToken);
	}

	function setupSignOutButton() {
		navigation.setOptions({
			headerRight: () => (
			  <Pressable onPress={() => { onSignOut(); }}>
			  	<Text style={styles.navbarSubmit}>Sign Out</Text>
			  </Pressable>
			)
		});		
	}
	
	function onEditPost(item) {		
	}
	
	return (
		<View style={styles.container}>
			<View style={styles.profilePane}>
				<Image style={styles.profilePhoto} source={{ uri: "https://micro.blog/" + username + "/avatar.jpg" }} />
				<Text style={styles.profileUsername}>@{username}</Text>
			</View>
			<View style={styles.micropubPane}>
				<Text style={styles.micropubHostname}>Posting to: {hostname}</Text>
				<Pressable style={styles.micropubButton} onPress={() => { onChangePressed(); }}>
					<Text style={styles.micropubButtonTitle} accessibilityLabel="change posting blog">Change...</Text>
				</Pressable>
			</View>
			<FlatList
				style={styles.profilePosts}
				data = {posts}
				renderItem = { ({item}) => 
				<Pressable onPress={() => { onEditPost(item) }}>
					<View style={styles.profilePost}>
						<Text ellipsizeMode="tail" numberOfLines={3}>{item.text}</Text>
					</View>
				</Pressable>
				}
				keyExtractor = { item => item.id }
			/>
		</View>
	);
}
