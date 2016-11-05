import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Text,
  AsyncStorage,
  Image,
  CameraRoll,
  TouchableOpacity,
  Dimensions,
  AlertIOS,
  Linking,
  TextInput,
  Input
} from 'react-native';
import { Font } from 'exponent';
import ModalView from './tagsModal';
import { Container, Header, Title, Content, Footer, Button, Spinner } from 'native-base';
import { Ionicons } from '@exponent/vector-icons';
import { Geocoder } from 'react-native-geocoder';
import Share, {ShareSheet} from 'react-native-share';

const STORAGE_KEY = 'id_token';

export default class Memory extends Component {
  constructor(props) {
    super(props);

    this.state = {
      image: this.props.image,
      tags: [],
      filteredTags: [],
      status: false,
      databaseId: '',
      caption: '',
      savePhoto: false,
      longitude: this.props.longitude,
      latitude: this.props.latitude,
      city: null,
      state: null,
      visible: false
    };
  }

  _navigate() {
    this.props.navigator.push({
      name: 'Homescreen',
      passProps: {
        'username': this.props.username
      }
    });
  }

   _navigateMemories() {
    this.props.navigator.replacePrevious({
      name: 'Memories',
      passProps: {
        'username': this.props.username
      }
    });
    this.props.navigator.pop();
  }



  async componentDidMount() {
    await Font.loadAsync({
      'pacifico': require('./assets/fonts/Pacifico.ttf'),
      'montserrat': require('./assets/fonts/Montserrat-Regular.ttf'),
      'helvetica': require('./assets/fonts/HelveticaNeueMed.ttf')
    });
    this.setState({ fontLoaded: true });
    if (this.props.prevScene === 'Homescreen') {
      this.uploadPhoto();
    } else {
      this.getMemoryData(this.props.id, 0);
    }

  }

  async uploadPhoto() {
    var context = this;
    var photo = {
      uri: this.state.image.uri,
      type: 'image/jpeg',
      name: 'image.jpg',
    };

    var location = {
      latitude: this.state.latitude,
      longitude:this.state.longitude
    }

    try {
      var token =  await AsyncStorage.getItem(STORAGE_KEY);
    } catch (error) {
      console.log('AsyncStorage error: ' + error.message);
    }

    var form = new FormData();
    form.append('memoryImage', photo);
    fetch('https://spooky-tagme.herokuapp.com/api/memories/upload',
    {
      body: form,
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    }).then(function(res) {
      var databaseId = JSON.parse(res['_bodyInit']);
      fetch(`https://spooky-tagme.herokuapp.com/api/memories/location/${databaseId}`,
      {
        body: JSON.stringify(location),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      context.getMemoryData(databaseId, 0);
    });
  }

  async getMemoryData(id, pings) {
    const context = this;
    try {
      var token =  await AsyncStorage.getItem(STORAGE_KEY);
    } catch (error) {
      console.log('AsyncStorage error: ' + error.message);
    }


    await fetch(`https://spooky-tagme.herokuapp.com/api/memories/id/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).then(function(res) {
      var memory = JSON.parse(res['_bodyInit']);
      var microsoftTags = [];
      var clarifaiTags = [];
      var caption = [];
      // it isnt guranteed that microsoft will be before clarifai, correct?
      if (memory.analyses[0].tags && memory.analyses[0].tags.length > 0) {
        microsoftTags = memory.analyses[0].tags;
      }
      if (memory.analyses[1].tags && memory.analyses[1].tags.length > 0) {
        clarifaiTags = memory.analyses[1].tags;
      }

      if (memory.analyses[2].tags && memory.analyses[2].tags.length > 0) {
        caption = memory.analyses[2].tags[0].replace(/(\r\n|\n|\r)/gm, ' ').replace('.', '');
      }
      var analyses = _.uniq(microsoftTags.concat(clarifaiTags));
      var savedTags = memory.tags;
      var date = new Date(memory.createdAt).toString().slice(0, 15);
      context.setState({
        tags: analyses,
        filteredTags: savedTags,
        status: true,
        databaseId: id,
        date: date,
        caption: caption,
        longitude: memory.longitude,
        latitude: memory.latitude
      });
    }).catch((err) => {
      console.log('ERROR', err);
      // Try pinging database again
      if (pings < 200) {
        context.getMemoryData(id, pings + 1);
      } else {
        var date = new Date().toString().slice(0, 15);
        context.setState({
          tags: [],
          filteredTags: [],
          status: true,
          databaseId: id,
          date: date,
          caption: 'Request Timeout'
        });
      }
    })

    this.getCityName();
  }


  async saveToCameraRoll() {
    CameraRoll.saveToCameraRoll(this.state.image.uri);
    this.setState({
      savePhoto: true,
      savePhotoText: 'Saved!'
    });
  }

  async updateTags(filteredTags) {
    this.setState({
      filteredTags: filteredTags
    });

    try {
      var token =  await AsyncStorage.getItem(STORAGE_KEY);
    } catch (error) {
      console.log('AsyncStorage error: ' + error.message);
    }

    fetch(`https://spooky-tagme.herokuapp.com/api/memories/id/${this.state.databaseId}`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tags: this.state.filteredTags
      })
    }).catch((err) => {
      console.log(err);
    })
  }

  async getCityName() {
    const context = this;
    const myKey = 'AIzaSyBsY6oEKTUuYyJos6jKuvTUT3aDlYKWbts'
    var location = {
      lat: this.state.latitude,
      lng: this.state.longitude
    };

   await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.lat},${location.lng}&key=${myKey}`, {
    method: 'GET'
   }).then((res) => {
    var result = JSON.parse(res['_bodyInit'])
    context.setState({city: result.results[0].address_components[3].long_name, state: result.results[0].address_components[5].short_name, visible: true})
   }).catch((err) => {
    console.log('error with gelocation fetch')
   })


  }


  async deletePhoto() {
    var context = this;

    try {
      var token =  await AsyncStorage.getItem(STORAGE_KEY);
    } catch (error) {
      console.log('AsyncStorage error: ' + error.message);
    }

    await fetch(`https://spooky-tagme.herokuapp.com/api/memories/delete/${this.state.databaseId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        id: this.state.databaseId,
        user: this.props.username
      })
    }).then(function(res) {

      context._navigateMemories();
    }).catch(function(err) {
      console.log('error with fetch POST request', err);
    });
  }

  deleteAlert() {
    AlertIOS.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        {text: 'Yes', onPress: () => this.deletePhoto()},
        {text: 'No'}
      ]
    )
  }

  openMapAlert() {
    AlertIOS.alert(
      'Open Map',
      'You want to see where this photo is taken?',
      [
        {text: 'Yes', onPress: () => this.openMap()},
        {text: 'No'}
      ]
    )
  }

  async editCaption() {
    console.log('editCaption invoked');
    console.log('this.state.caption = ', this.state.caption);
    AlertIOS.prompt(
      'Edit caption',
      null,
      text => this.setState({caption: text}) 
    )

    try {
      var token =  await AsyncStorage.getItem(STORAGE_KEY);
    } catch (error) {
      console.log('AsyncStorage error: ' + error.message);
    }

    await fetch(`https://spooky-tagme.herokuapp.com/api/memories/update:caption/${this.state.databaseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        id: this.state.databaseId,
        user: this.props.username,
        caption: this.state.caption
      })
    }).then(function(res) {
      console.log('successful put request', this.state.caption);
    }).catch(function(err) {
      console.log('error with fetch PUT request', err);
    });

  }


  openMap() {
    var geoLocation = `http://maps.apple.com/?daddr=${this.state.latitude},${this.state.longitude}`;
    Linking.openURL(geoLocation);
  }

  render() {

    let shareOptions = {
      title: "title test share options",
      message: this.state.caption,
      url: this.state.image.uri,
      subject: "Check out this TageMe photo!" //  for email
    };

    let shareImageBase64 = {
      title: 'title test',
      message: this.state.caption,
      url: this.state.image.uri,
      subject: "Check out this TagMe photo!" //  for email
    };

    var showCity = this.state.visible ?
      <Text
        onLongPress={() => this.openMapAlert()}
        style={styles.city}>
        <Ionicons name="ios-pin-outline" size={20} color="#25a2c3" /> {`${this.state.city}, ${this.state.state}`}
      </Text>
      : null;

    var saving = this.state.savePhoto ?
      <Ionicons style={styles.iconButton} name="ios-download-outline" size={40} color="#D8D3D3" />
      :
      <Ionicons style={styles.iconButton} onPress={this.saveToCameraRoll.bind(this)} name="ios-download-outline" size={40} color="#5F5E5E" />

    var disabled = false;
    var loading = (this.state.status && this.props.prevScene !== 'ExplorePage') ?
    <ModalView
    prevScene={this.props.prevScene}
    tags={this.state.tags}
    updateTags={this.updateTags.bind(this)}
    status={this.state.status}
    />
    : null;
    return (
      <Container style={ {backgroundColor: 'white'} }>
        <Header>
          <Button transparent onPress={() => this.props.navigator.pop()}>
            <Ionicons name="ios-arrow-back" size={32} style={{color: '#25a2c3', marginTop: 5}}/>
          </Button>
          <Title style={styles.headerText}>{this.state.date}</Title>
          {
            this.props.prevScene !== 'ExplorePage' ?
            <Button transparent onPress={this._navigate.bind(this)}>
              <Ionicons name="ios-home" size={35} color="#444" />
            </Button>
            :null
          }
        </Header>
        <Content>

          <Image style={styles.image} resizeMode={Image.resizeMode.contain} source={{uri: this.state.image.uri}}/>


          <View style={styles.flexRow}>
            {saving}

            <Ionicons style={styles.iconButton} onPress={()=>{
              Share.open(shareImageBase64);
            }} name="ios-share-outline" size={40} color="#5F5E5E" />

            {loading}

            {
              this.props.prevScene !== 'ExplorePage' ?
              <Ionicons style={styles.iconButton} onPress={this.deleteAlert.bind(this)}
              name="ios-trash-outline" size={40} color="#5F5E5E" />
              :null
            }
          </View>

          {showCity}
          <Text style={styles.caption}>{this.state.caption}</Text>
          <Ionicons style={styles.iconButton} onPress={this.editCaption.bind(this)}
          name="ios-create-outline" size={40} color="#5F5E5E" />
          <MemoryDetails
            navigator={this.props.navigator}
            status={this.state.status}
            tags={this.state.filteredTags}
            location={this.state.location}
          />

        </Content>

      </Container>
      );
  }
}

class MemoryDetails extends React.Component {
  constructor(props) {
    super(props);
  }

  explore() {
    AlertIOS.alert('it works')
  }

  _navigateExplore(key) {
    this.props.navigator.push({
      name: 'ExplorePage',
      passProps: {
        'tag': key
      }
    });
  }


  render() {
    var loading = !this.props.status ?
    <Spinner
    color='red'
    animating={true}
    size='large'
    style={styles.spinner}>
    </Spinner>
    : null;
    return (
      <View>
        <View style={styles.tagsContainer}>
        {
          this.props.tags.map(tag =>
            <Button
            key={tag}
            onLongPress={this._navigateExplore.bind(this, tag)}
            style={styles.tag}
            rounded info>
            <Text style={styles.tagText}>{tag}</Text>
            </Button>
            )
        }
        </View>
        {loading}
      </View>
      );
  }
}


const styles = StyleSheet.create({
  headerText: {
    ...Font.style('pacifico'),
    fontSize: 30,
    color: '#444',
    paddingTop: 25
  },

  tagsContainer: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
    flex: 1
  },

  caption: {
    ...Font.style('montserrat'),
    fontSize: 16,
    // textAlign: 'center',
    margin: 10
  },

  tag: {
    margin: 10
  },

  tagText: {
    ...Font.style('helvetica'),
    color: '#fff',
    fontSize: 16,
    letterSpacing: 1
  },

  image: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').width
  },

  spinner: {
    padding: 100
  },

  iconButton: {
    backgroundColor: 'transparent',
    marginLeft: 35,
    marginTop: 6,
    marginRight: 35
  },

  button: {
    width: 200,
    margin: 10,
    backgroundColor: '#f6755e',
    padding: 10,
    borderRadius: 4
  },
  buttonDisabled: {
    margin: 10,
    backgroundColor: '#f6755e',
    padding: 10,
    borderRadius: 4,
    opacity: 0.3
  },
  buttonText: {
    ...Font.style('montserrat'),
    color: '#fff',
    fontSize: 18,
    textAlign: 'center'
  },
  flexRow: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#DBDADA',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },

  city: {
    ...Font.style('montserrat'),
    color: '#25a2c3',
    marginLeft:10,
    fontSize: 18
  }
});

