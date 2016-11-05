import Exponent, { Font } from 'exponent';
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  AlertIOS,
  AsyncStorage,
  StatusBar,
  Dimensions
} from 'react-native';
import { Container, Header, Title, Content, Footer, Button } from 'native-base';
import { Ionicons } from '@exponent/vector-icons';

const STORAGE_KEY = 'id_token';

export default class Homescreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      fontLoaded: false,
      initialPosition: null
    }
  }

  async componentDidMount() {
    console.log('there is the homescreen');
    await Font.loadAsync({
      'pacifico': require('./assets/fonts/Pacifico.ttf'),
      'montserrat': require('./assets/fonts/Montserrat-Regular.ttf')
    });
    this.setState({ fontLoaded: true });
  }

  async _userLogout() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem('username');
      AlertIOS.alert("Logout Success!")
    } catch (error) {
      console.log('AsyncStorage error: ' + error.message);
    }
  }

  _navigate(sceneName, imageUri, location) {
    this.props.navigator.push({
      name: sceneName,
      passProps: {
        'image': {uri: imageUri},
        'username': this.props.username,
        'prevScene': 'Homescreen',
        'longitude': location ? location.longitude : undefined,
        'latitude': location ? location.latitude : undefined
      }
    });
  }

  _navigateLogout() {
    this.props.navigator.push({
      name: 'Login'
    })
  }

  logout() {
    this._userLogout()
    .then(()=> {
      this._navigateLogout();
    })
    .catch((err)=> {
      console.log('error logging out', err);
    });
  }

  getImage() {
    var oneImage = async function(){
      return Exponent.ImagePicker.launchImageLibraryAsync({});
    };
    oneImage().then((image)=> {
      if (!image.cancelled) {
        this._navigate('Memory', image.uri);
      }
    });
  }

  componentWillUnmount() {
    navigator.geolocation.clearWatch(this.watchID);
  }


  takeImage() {
    var newImage = async function() {
      return Exponent.ImagePicker.launchCameraAsync({});
    };
    newImage().then((image) => {
      if (!image.cancelled) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const initialPosition = JSON.stringify(position);
            const location = {longitude: position.coords.longitude, latitude: position.coords.latitude}
            this._navigate('Memory', image.uri, location);
          },
          (error) => alert(JSON.stringify(error)),
          {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
        );

      }

    });
  }

  render() {
    return (
      <Container>
        <View>
          <StatusBar
            backgroundColor='black'/>
        </View>
        <View style={styles.backgroundImageWrapper}>
          <Image source={require('./assets/images/city.jpg')} style={styles.backgroundImage} />
        </View>
        <Header style={{height: 80, zIndex: 1}}>
          {this.state.fontLoaded ? <Title style={styles.headerText}>TagMe</Title>:null}
          <Button transparent onPress={this.logout.bind(this)}>
            <Image source={require('./assets/images/logoutTextIcon.png')} style={styles.logoutTextIcon} resizeMode={Image.resizeMode.contain}/>
            </Button>
        </Header>
        <View style={styles.container}>
          {
            this.state.fontLoaded ? (
            <View style={styles.centered}>
              <View style={styles.flexRow}>
                <Button primary style={styles.takePhotoButton} onPress={this.takeImage.bind(this)}>
                  <View style={[styles.centered, styles.flexCol]}>
                    <Text style={[styles.buttonText, styles.takePhotoButtonText]}>Take Photo</Text>
                    <Ionicons name="ios-camera-outline" size={60} color="white" />
                  </View>
                </Button>
              </View>

              <View style={[styles.flexRow, {marginTop: 100}]}>
                <Button primary style={styles.choiceButton} onPress={() => this._navigate('Memories')}>
                  <Text style={[styles.buttonText, styles.choiceButtonText]}>
                    View All    <Ionicons name="ios-images-outline" size={30} color="white" />
                  </Text>
                </Button>

                <Button primary style={styles.choiceButton} onPress={this.getImage.bind(this)}>
                  <Text style={[styles.buttonText, styles.choiceButtonText]}>
                    Upload    <Ionicons name="ios-cloud-upload-outline" size={30} color="white" />
                  </Text>
                </Button>
              </View>
            </View>
            ) : null
          }
        </View>
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  backgroundImageWrapper: {
    position: 'absolute',
    top: 0,
    zIndex: 0,
    alignItems: 'center'
  },

  backgroundImage: {
    flex: 1,
    resizeMode: 'stretch'
  },

  headerText: {
    ...Font.style('pacifico'),
    fontSize: 30,
    color: '#444',
    paddingTop: 35
  },

  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },

  centered: {
    alignItems: 'center'
  },

  flexRow: {
    flexDirection: 'row'
  },

  flexCol: {
    flexDirection: 'column'
  },

  choiceButton: {
    height: 80,
    width: (Dimensions.get('window') - 10) / 2,
    borderRadius: 4,
    backgroundColor: '#f6755e',
    margin: 10
  },

  takePhotoButton: {
    height: 220,
    width: 220,
    borderRadius: 110,
    backgroundColor: '#25a2c3',
  },

  buttonText: {
    ...Font.style('montserrat'),
    fontWeight: 'bold',
    color: '#fff'
  },

  choiceButtonText: {
    fontSize: 22,

  },

  takePhotoButtonText: {
    fontSize: 27,
    paddingTop: 20
  },

  logoutTextIcon: {
    marginLeft: Dimensions.get('window').width - 220,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
