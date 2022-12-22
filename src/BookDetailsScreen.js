import React, { useState } from "react";
import type { Node } from "react";
import { ActivityIndicator, Pressable, Button, Image, FlatList, StyleSheet, Text, SafeAreaView, View, ScrollView } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MenuView } from "@react-native-menu/menu";
import ContextMenu from "react-native-context-menu-view";
import { InAppBrowser } from 'react-native-inappbrowser-reborn'

import { keys } from "./Constants";
import { useEpilogueStyle } from "./hooks/useEpilogueStyle";
import epilogueStorage from "./Storage";

export function BookDetailsScreen({ route, navigation }) {
	const styles = useEpilogueStyle()
	const [ data, setData ] = useState();
	const [ progressAnimating, setProgressAnimating ] = useState(false);
	const [ menuActions, setMenuActions] = useState([])	
	const { id, isbn, title, image, author, description, bookshelves, current_bookshelf, is_search } = route.params;

	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			onFocus(navigation);
		});
		return unsubscribe;
	}, [navigation]);
	
	function onFocus(navigation) {
		let bookshelf_title = current_bookshelf.title;
		let s = bookshelf_title + ": [" + title + "](https://micro.blog/books/" + isbn + ") by " + author + " 📚";
		epilogueStorage.set(keys.currentTitle, "");
		epilogueStorage.set(keys.currentText, s);

		var menu_items = [
			{
				id: "amazon",
				title: "Amazon"
			},
				{
				id: "goodreads",
				title: "Goodreads"
			},
				{
				id: "bookshop",
				title: "Bookshop.org"
			},
				{
				id: "worldcat",
				title: "WorldCat"
			}
		];
		setMenuActions(menu_items);

	}
	
	function addToBookshelf(bookshelf_id) {
		if (is_search) {
			copyToBookshelf(bookshelf_id);
		}
		else {
			assignToBookshelf(bookshelf_id);
		}
	}

	function assignToBookshelf(bookshelf_id) {
		let form = new FormData();
		form.append("book_id", id);
		
		epilogueStorage.get("auth_token").then(auth_token => {
			var options = {
				method: "POST",
				body: form,
				headers: {
					"Authorization": "Bearer " + auth_token
				}
			};
		
			setProgressAnimating(true);
		
			fetch("https://micro.blog/books/bookshelves/" + bookshelf_id + "/assign", options).then(response => response.json()).then(data => {
				navigation.goBack();
			});
		});
	}
	
	function copyToBookshelf(bookshelf_id) {
		let form = new FormData();
		form.append("isbn", isbn);
		form.append("title", title);
		form.append("author", author);
		form.append("cover_url", image);
		form.append("bookshelf_id", bookshelf_id);
		
		epilogueStorage.get("auth_token").then(auth_token => {
			var options = {
				method: "POST",
				body: form,
				headers: {
					"Authorization": "Bearer " + auth_token
				}
			};
		
			setProgressAnimating(true);
		
			fetch("https://micro.blog/books", options).then(response => response.json()).then(data => {
				epilogueStorage.remove(keys.currentSearch).then(() => {
					navigation.goBack();
				});
			});
		});
	}
	
	function viewBookOn(service) {
		var url;
		
		if (service == "Amazon") {
			url = "https://www.amazon.com/s?field-keywords=" + isbn;
		}
		else if (service == "Goodreads") {
			url = "https://www.goodreads.com/search?q=" + isbn;
		}
		else if (service == "Bookshop.org") {
			url = "https://bookshop.org/books?keywords=" + isbn;
		}
		else if (service == "WorldCat") {
			url = "https://www.worldcat.org/search?q=" + isbn;
		}
		
		if (url != undefined) {
			InAppBrowser.open(url)
		}
	}

	return (
		<ScrollView style={styles.bookDetailsScroll}>
			<View style={styles.container}>
				<View style={styles.bookDetails}>
					<ContextMenu
							title="View on..."
							onPress={({nativeEvent}) => {
								viewBookOn(nativeEvent.name);
							}}
							actions={menuActions}
							previewBackgroundColor="rgba(0, 0, 0, 0.0)"
						>
						<Image style={styles.bookDetailsCover} source={{ uri: image.replace("http://", "https://") }} />
					</ContextMenu>
					
					<Text style={styles.bookDetailsTitle}>{title}</Text>
					<Text style={styles.bookDetailsAuthor}>{author}</Text>
				</View>
				<View style={styles.bookDetailsBookshelves}>
					<View style={styles.bookDetailsAddBar}>
					<Text style={styles.bookDetailsAddTo}>Add to bookshelf...</Text>
					<ActivityIndicator style={styles.BookDetailsProgress} size="small" animating={progressAnimating} />
				</View>
				{
					bookshelves.map((shelf) => (
						<Pressable key={shelf.id} onPress={() => { addToBookshelf(shelf.id); }} style={({ pressed }) => [
							styles.bookDetailsButton,
							(pressed ? styles.bookDetailsButtonPressed : styles.bookDetailsButton)
						]}>
							<Text style={styles.bookDetailsBookshelfTitle}>{shelf.title}</Text>
							<Text style={styles.bookDetailsBookshelfCount}>{shelf.books_count}</Text>
						</Pressable>
					))
				}
				</View>
				<View style={
					description.length > 0 ?
					(styles.bookDetailsMore) :
					styles.bookDetailsNoDescription
					}>
					<Text style={styles.bookDetailsDescription}>{description}</Text>
				</View>
			</View>
		</ScrollView>
	);
}
