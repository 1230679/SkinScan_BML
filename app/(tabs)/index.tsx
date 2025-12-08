// @ts-nocheck
import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);

  // 1. Pick Image
  const pickImage = async () => {
    let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert("Permission to access gallery is required.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setDiagnosis(null);
    }
  };

  // 2. Send to API
  const analyzeSkin = async () => {
    if (!image) return;
    setLoading(true);
    
    let localUri = image;
    let filename = localUri.split('/').pop();
    let match = /\.(\w+)$/.exec(filename);
    let type = match ? `image/${match[1]}` : `image`;

    let formData = new FormData();
    formData.append('photo', { uri: localUri, name: filename, type });

    try {
      // IMPORTANT: Change the IP below to your machine's IP where Python is running
      const response = await axios.post('http://YOUR_IP_HERE:5000/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDiagnosis(response.data);
    } catch (error) {
      Alert.alert("Connection Error", "Could not connect to the backend server. Make sure your Python script is running.");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>SkinScan</Text>
        <Text style={styles.subtitle}>Check your moles in seconds.</Text>

        <View style={styles.imageContainer}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={{color: '#aaa'}}>No image selected</Text>
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.buttonSecondary} onPress={pickImage}>
            <Text style={styles.textSecondary}>Upload Photo</Text>
          </TouchableOpacity>

          {image && (
            <TouchableOpacity style={styles.buttonPrimary} onPress={analyzeSkin}>
              <Text style={styles.textPrimary}>Analyze Risk</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading && <ActivityIndicator size="large" color="#007bff" style={{marginTop: 20}} />}

        {diagnosis && (
          <View style={[styles.resultCard, diagnosis.prediction === 'malignant' ? styles.danger : styles.safe]}>
            <Text style={styles.resultTitle}>
              {diagnosis.prediction === 'malignant' ? "ATTENTION RECOMMENDED" : "LOW RISK DETECTED"}
            </Text>
            <Text style={styles.resultText}>
              {diagnosis.prediction === 'malignant' 
                ? "The model detected anomalies. We recommend consulting a dermatologist." 
                : "The mole appears benign. Continue monitoring."}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  container: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#e1e4e8',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 30,
    gap: 15,
  },
  buttonPrimary: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  buttonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007bff',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  textPrimary: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  textSecondary: {
    color: '#007bff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultCard: {
    marginTop: 30,
    padding: 20,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  safe: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 1,
  },
  danger: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
  },
  resultTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 5,
    color: '#333',
  },
  resultText: {
    textAlign: 'center',
    color: '#555',
  }
});