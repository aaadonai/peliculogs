import AsyncStorage from "@react-native-async-storage/async-storage";

class EpilogueStorage {
	async set(key, value) {
		try {
			console.log("setting key: " + key);
			await AsyncStorage.setItem(key, value);
			console.log("did set key: " + key);
		}
		catch (e) {
			console.log("Error setting key: " + key);
			console.log(e);
		}
	}
		
	async get(key) {
		try {
			const value = await AsyncStorage.getItem(key);
			if (value != null) {
				return value;
			}
		}
		catch (e) {
			console.log("Error getting key: " + key);
			console.log(e);
		}
		
		return null;
	}
}

export default new EpilogueStorage();