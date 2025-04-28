import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { firestore } from '../Firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function OrganizationCard() {

    const [logo, setLogo] = useState(null);
    const [memberCount, setMemberCount] = useState(0);
    const [description, setDescription] = useState('');
    const [orgName, setOrgName] = useState('');

    useEffect (() => {

        const fetchOrgData = async () =>{
            try{
                const docRef = doc(firestore, 'organizations', 'orgId') ;
                const docSnap = await getDoc(docRef);

                //get values
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setOrgName(data.orgName);
                    setMemberCount(data.members);
                    setDescription(data.description);
                    setLogo(data.logoUrl);
                }else{
                    console.log('No Registry Found')
                }
                
            }catch(error){
                console.error('Error fetching organzation data:', error)
            }
        }

        fetchOrgData();
    }, []);

    return (
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <Image
                    source={{ uri: logo }}
                    style={styles.orgcardlogo}
                />
                <Text style={styles.orgName}>{orgName}</Text>
            </View>
            <Text style={styles.memberCount}>{memberCount} members</Text>
            <Text style={styles.description}>
                {description}
            </Text>
        </View>
    );
}


const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginVertical: 10,
        marginHorizontal: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    orgcardlogo: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    orgName: {
        fontSize: 16,
        fontWeight: 'bold',
        flexShrink: 1,
    },
    memberCount: {
        fontSize: 14,
        color: 'gray',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        color: '#333',
    },
});
