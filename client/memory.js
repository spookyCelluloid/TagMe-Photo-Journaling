import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Text,
  AsyncStorage,
  Image,
  CameraRoll,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Font } from 'exponent';
import ModalView from './tagsModal';
import { Container, Header, Title, Content, Footer, Button, Spinner } from 'native-base';
import { Ionicons } from '@exponent/vector-icons';
import { Geocoder } from 'react-native-geocoder';
import Share, {ShareSheet} from 'react-native-share';


var STORAGE_KEY = 'id_token';

export default class Memory extends React.Component {
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
        'Authorization': 'Bearer ' + token
      }
    }).then(function(res) {
      var databaseId = JSON.parse(res['_bodyInit']);
      fetch('https://spooky-tagme.herokuapp.com/api/memories/location/' + databaseId,
      {
        body: JSON.stringify(location),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        }
      });
      context.getMemoryData(databaseId, 0);
    });
  }

  async getMemoryData(id, pings) {
    console.log('getMemoryData is called');
    var context = this;
    try {
      var token =  await AsyncStorage.getItem(STORAGE_KEY);
    } catch (error) {
      console.log('AsyncStorage error: ' + error.message);
    }


    await fetch('https://spooky-tagme.herokuapp.com/api/memories/id/' + id, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
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
    }).catch(function(err) {
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

    fetch('https://spooky-tagme.herokuapp.com/api/memories/id/' + this.state.databaseId, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tags: this.state.filteredTags
      })
    }).catch(function(err) {

    })
  }

  async getCityName() {
    var context = this;
    var myKey = 'AIzaSyBsY6oEKTUuYyJos6jKuvTUT3aDlYKWbts'
    var location = {
      lat: this.state.latitude,
      lng: this.state.longitude
    };

   await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.lat},${location.lng}&key=${myKey}`, {
    method: 'GET'
   }).then(function(res){
    var result = JSON.parse(res['_bodyInit'])
    context.setState({city: result.results[0].address_components[3].long_name, state: result.results[0].address_components[5].short_name, visible: true})
   }).catch(function(err){
    console.log('error with gelocation fetch')
   })


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
      <Text style={styles.city}> {`${this.state.city}, ${this.state.state}`} </Text>
      : null;

    var saving = this.state.savePhoto ?
      <Ionicons style={styles.iconButton} name="ios-download-outline" size={40} color="#D8D3D3" />
      :
      <Ionicons style={styles.iconButton} onPress={this.saveToCameraRoll.bind(this)} name="ios-download-outline" size={40} color="#5F5E5E" />

    var disabled = false;
    var loading = this.state.status ?
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
          <Button transparent onPress={this._navigate.bind(this)}>
            <Ionicons name="ios-home" size={35} color="#444" />
          </Button>
        </Header>
        <Content>

          <Image style={styles.image} resizeMode={Image.resizeMode.contain} source={{uri: this.state.image.uri}}/>


          <View style={styles.flexRow}>
            {saving}

            <Ionicons style={styles.iconButton} onPress={()=>{
              Share.open(shareImageBase64);
            }} name="ios-share-outline" size={40} color="#5F5E5E" />

            {loading}
          </View>

          {showCity}
          <Text style={styles.caption}>{this.state.caption}</Text>
          <MemoryDetails
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
    color: 'black',
    marginLeft:10,
    fontSize: 18
  }
});
