import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useNavigation } from '@react-navigation/native';
import BottomNavBar from '../components/bottomNavBar';
import { auth} from '../Firebase';
import { signOut } from "firebase/auth";

export default function Settings() {
    const navigation = useNavigation();
    const handlePress = () => {
        console.log("clicked");
    };
    const logOut = async() => {
        try {
            await signOut(auth);
            navigation.replace('Landing');
            console.log("User signed out successfully");
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    }
    
    return (
    <View style={styles.container}>

        <View>
            <Text style={styles.title}>
                Account Settings
            </Text>
        </View>
        
        <TouchableOpacity style={styles.upperContent} onPress={handlePress}>
                <Image
                  source={require("../assets/profile.png")}
                  style={{ maxHeight: 32, maxWidth: 32, marginLeft: 5 }}
                  resizeMode="contain"
                />
                <View style={styles.innerContent}>
                  <Text style={styles.innerView}>Profile Settings</Text>
                  <View style={styles.arrow}>
                    <Image
                        source={require("../assets/arrow.png")}
                        style={styles.innerImage}
                        resizeMode="contain"
                    />
                  </View>
                </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.upperContent} onPress={handlePress}>
            <Image
            source={require("../assets/activity.png")}
            style={{maxHeight: 32, maxWidth: 32, marginLeft: 5 }}
            resizeMode="contain"
            />
            <View style={styles.innerContent}>
                <Text style={styles.innerView}>
                    Your Activity
                </Text>
                <View style={styles.arrow}>
                    <Image
                        source={require("../assets/arrow.png")}
                        style={styles.innerImage}
                        resizeMode="contain"
                    />
                </View> 
            </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.upperContent} onPress={handlePress}>
            <Image
            source={require("../assets/notif.png")}
            style={{maxHeight: 32, maxWidth: 32, marginLeft: 5 }}
            resizeMode="contain"
            />
            <View style={styles.innerContent}>
                <Text style={styles.innerView}>
                    Notifications
                </Text>
                <View style={styles.arrow}>
                    <Image
                        source={require("../assets/arrow.png")}
                        style={styles.innerImage}
                        resizeMode="contain"
                    />
                </View> 
            </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.upperContent} onPress={handlePress}>
            <Image
            source={require("../assets/review.png")}
            style={{maxHeight: 32, maxWidth: 32, marginLeft: 5 }}
            resizeMode="contain"
            />
            <View style={styles.innerContent}>
                <Text style={styles.innerView}>
                    Review posts and tags
                </Text>
                <View style={styles.arrow}>
                    <Image
                        source={require("../assets/arrow.png")}
                        style={styles.innerImage}
                        resizeMode="contain"
                    />
                </View> 
            </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.upperContent} onPress={handlePress}>
            <Image
            source={require("../assets/help.png")}
            style={{maxHeight: 32, maxWidth: 32, marginLeft: 5 }}
            resizeMode="contain"
            />
            <View style={styles.innerContent}>
                <Text style={styles.innerView}>
                    Help
                </Text>
                <View style={styles.arrow}>
                    <Image
                        source={require("../assets/arrow.png")}
                        style={styles.innerImage}
                        resizeMode="contain"
                    />
                </View> 
            </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.upperContent} onPress={handlePress}>
            <Image
            source={require("../assets/info.png")}
            style={{maxHeight: 32, maxWidth: 32, marginLeft: 5 }}
            resizeMode="contain"
            />
            <View style={styles.innerContent}>
                <Text style={styles.innerView}>
                    About
                </Text>
                <View style={styles.arrow}>
                    <Image
                        source={require("../assets/arrow.png")}
                        style={styles.innerImage}
                        resizeMode="contain"
                    />
                </View> 
            </View>
        </TouchableOpacity>

        <View style={styles.invisibleBlock}>
        </View>

        <TouchableOpacity style={styles.bottomContent} onPress={handlePress}>
            <Image
            source={require("../assets/switch.png")}
            style={{maxHeight: 32, maxWidth: 32, marginLeft: 5 }}
            resizeMode="contain"
            />
            <View style={styles.innerContent}>
                <Text style={styles.innerView}>
                    Change account
                </Text>
                <View style={styles.arrow}>
                    <Image
                        source={require("../assets/arrow.png")}
                        style={styles.innerImage}
                        resizeMode="contain"
                    />
                </View> 
            </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomContent} onPress={logOut}>
            <Image
            source={require("../assets/sign_out.png")}
            style={{maxHeight: 32, maxWidth: 32, marginLeft: 5 }}
            resizeMode="contain"
            />
            <View style={styles.innerContent}>
                <Text style={styles.innerView}>
                    Log Out
                </Text>
                <View style={styles.arrow}>
                    <Image
                        source={require("../assets/arrow.png")}
                        style={styles.innerImage}
                        resizeMode="contain"
                    />
                </View> 
            </View>
        </TouchableOpacity>
        <BottomNavBar/>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    title: {
        fontSize: 20,
        textAlign: 'center',
        fontWeight: 'bold',
        borderBottomWidth: 1,
        padding: 20
    },
    upperContent: {
        flex: 1,
        maxHeight: 70,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'flex-start',
    },
    bottomContent: {
        flex: 1,
        maxHeight: 70,
        alignItems: 'center',
        flexDirection: 'row',
    },
    invisibleBlock:{
        flex: 1,
    },
    innerContent:{
        flex: 1,
        maxHeight: 70,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        borderBottomWidth: 1
    },
    innerView: {
        fontSize: 13,
        paddingTop: 15,
        paddingBottom: 15,
        paddingLeft: 5,
        fontWeight: 'bold',
    },
    innerImage: {
        maxHeight: 33,
        maxWidth: 33,
        marginRight: 5
    },
    arrow: {
        flex: 1,
        alignItems: 'flex-end',
    }
});