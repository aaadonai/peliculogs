import React, { useState } from "react";
import type { Node } from "react";
import { TextInput, ActivityIndicator, useColorScheme, Pressable, Button, Image, StyleSheet, Text, SafeAreaView, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";

import styles from "./Styles";
import epilogueStorage from "./Storage";

export function PostScreen({ navigation }) {
	const [ text, setText ] = useState();
	const [ blogID, setBlogID ] = useState();
	const [ blogName, setBlogName ] = useState();
	const [ progressAnimating, setProgressAnimating ] = useState(false);

	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			onFocus(navigation);
		});
		return unsubscribe;
	}, [navigation]);	
	
	function onFocus(navigation) {
		setupPostButton();
		setupFields();
	}
	
	function onShowBlogs() {
		navigation.navigate("Blogs");
	}
		
	function onChangeText(text) {
		setText(text);
		epilogueStorage.set("current_text", text);
	}
	
	function setupPostButton() {
		navigation.setOptions({
			headerRight: () => (
			  <Pressable onPress={() => { onSendPost(); }}>
				<Text style={styles.navbarSubmit}>Post</Text>
			  </Pressable>
			)
		});		
	}
	
	function setupFields() {
		epilogueStorage.get("current_text").then(current_text => {
			if (current_text != null) {
				setText(current_text);
			}
		});
		
		epilogueStorage.get("current_blog_name").then(blog_name => {
			setBlogName(blog_name);
		});

		epilogueStorage.get("current_blog_id").then(blog_id => {
			setBlogID(blog_id);
		});
	}
	
	function onSendPost() {
		setProgressAnimating(true);
		
		epilogueStorage.get("current_text").then(current_text => {
			epilogueStorage.get("current_blog_id").then(blog_id => {
				let form = new FormData();
				form.append("content", current_text);
				form.append("mp-destination", blog_id);
								
				epilogueStorage.get("auth_token").then(auth_token => {
					var options = {
						method: "POST",
						body: form,
						headers: {
							"Authorization": "Bearer " + auth_token
						}
					};
				
					// setProgressAnimating(true);
				
					fetch("https://micro.blog/micropub", options).then(response => response.json()).then(data => {
						navigation.goBack();
					});
				});
			});
		});
	}
	
	return (
		<View style={styles.postTextBox}>
			<Pressable style={styles.postHostnameBar} onPress={onShowBlogs}>
				<Text style={styles.postHostnameLeft}></Text>
				<Text style={styles.postHostnameText}>{blogName}</Text>
				<ActivityIndicator style={styles.postHostnameProgress} size="small" animating={progressAnimating} />
			</Pressable>
			<TextInput style={styles.postTextInput} value={text} onChangeText={onChangeText} multiline={true} />
		</View>
	);
}
