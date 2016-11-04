import React from 'react';
import {
  StyleSheet,
  AsyncStorage,
  View,
  Text,
  TouchableHighlight,
  CameraRoll,
  Image,
  ScrollView,
  Dimensions,
  AlertIOS
} from 'react-native';
import { Font } from 'exponent';
import { Container, Header, Title, Content, Footer, InputGroup, Input, Button } from 'native-base';
import { Ionicons } from '@exponent/vector-icons';

var STORAGE_KEY = 'id_token';

export default class Memories extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      image: {},
      imageList: [],
      queryList: [],
      fontLoaded: false,
      searchQuery: '',
      searching: false
    };
  }

  async componentDidMount() {
    await Font.loadAsync({
      'pacifico': require('./assets/fonts/Pacifico.ttf'),
    });
    this.setState({ fontLoaded: true });
    this.fetchMemories();
  }

  async saveToCameraRoll() {
    console.log('this in saveAll', this.state.imageList);
    this.state.imageList.map( memory => (
      CameraRoll.saveToCameraRoll(memory.uri)
      ))
  }

  _navigate(image) {
    this.props.navigator.push({
      name: 'Memory',
      passProps: {
        'image': {uri: image.uri},
        'id': image.id,
        'username': this.props.username,
        'prevScene': 'Memories'
      }
    });
  }

  _navigateHome() {
    this.props.navigator.push({
      name: 'Homescreen',
      passProps: {
        'username': this.props.username
      }
    });
  }



  async fetchMemories() {
    var context = this;
    this.setState({searching: false});
    try {
      var token =  await AsyncStorage.getItem(STORAGE_KEY);
    } catch (error) {
      console.log('AsyncStorage error: ' + error.message);
    }

    fetch('https://spooky-tagme.herokuapp.com/api/memories/all', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    })
    .then(function(memories) {
      var memoryArray = JSON.parse(memories['_bodyInit']);
      var images = memoryArray.map(memory => {
        return {
          id: memory._id,
          uri: memory.filePath
        };
      });
      context.setState({imageList: images});
    });
  }

  async search() {
    var context = this;
    try {
      var token =  await AsyncStorage.getItem(STORAGE_KEY);
    } catch (error) {
      console.log('AsyncStorage error: ' + error.message);
    }
    fetch('https://spooky-tagme.herokuapp.com/api/memories/search/' + this.state.searchQuery.toLowerCase(), {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    }).then(function(memories) {
      var memoryArray = JSON.parse(memories['_bodyInit']);
      var images = memoryArray.map(memory => {
        return {
          id: memory._id,
          uri: memory.filePath
        };
      });
      context.setState({
        queryList: images,
        searching: true,
        searchQuery: ''});
    })
  }

  

  render() {
    return (
      <Container style={ {backgroundColor: 'white'} }>
      {
        this.state.fontLoaded ? (
          <Header>
          <Button transparent onPress={() => this.props.navigator.pop()}>
          <Ionicons name="ios-arrow-back" size={32} style={{color: '#25a2c3', marginTop: 5}}/>
          </Button>
          <Button transparent onPress={this._navigateHome.bind(this)}>
          <Ionicons name="ios-home" size={35} color="#444" />
          </Button>
          <Title style={styles.headerText}>{this.props.username}</Title>
          </Header>
          ) : null
      }
      <View style={{flexDirection: 'row', margin: 10}}>
      <InputGroup borderType='rounded' style={{width: 250}}>
      <Input
      placeholder='Search'
      onChangeText={(text) => this.setState({searchQuery: text})}
      value={this.state.searchQuery}
      />
      </InputGroup>
      <Button rounded style={{backgroundColor: '#25a2c3', marginLeft: 5}} onPress={this.search.bind(this)}>
      <Ionicons name='ios-search' size={25} color="#fff"/>
      </Button>
      {
        this.state.searching ? (
          <Button rounded bordered style={{borderColor: '#ccc', marginLeft: 5}}
          onPress={this.fetchMemories.bind(this)}>
          <Text style={{color: '#444'}}>Cancel</Text>
          </Button>
          ) : null
      }
      </View>
      <Content contentContainerStyle={{
        flexWrap: 'wrap',
        flexDirection: 'row',
        alignItems: 'center'
      }}>
      {
        this.state.searching ? (
          this.state.queryList.map(image =>
            <TouchableHighlight onPress={this._navigate.bind(this, image)}  >
            <Image style={styles.thumbnail} resizeMode={Image.resizeMode.cover} source={{uri: image.uri}}/>
            </TouchableHighlight>
            )
          )
        :
        this.state.imageList.map(image =>
          <TouchableHighlight key={image.id}  onPress={this._navigate.bind(this, image)}>
          <Image style={styles.thumbnail} resizeMode={Image.resizeMode.cover} source={{uri: image.uri}}/>
          </TouchableHighlight>
          )
      }
      </Content>
      <View>
      <Button style={styles.saveAll} onPress={this.saveToCameraRoll.bind(this)}><Text style={styles.buttonText}>Save all memories</Text></Button>
      </View>
      </Container>
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

  saveAll: {
    width: 200,
    marginLeft: 2,
    backgroundColor: '#f6755e',
    padding: 10,
    borderRadius: 4,
    position: 'absolute',
    bottom: 2,
    left: 0
  },

  thumbnail: {
    width: (Dimensions.get('window').width- 8) / 4,
    height: (Dimensions.get('window').width- 8) / 4,
    margin: 1
  },

  buttonText: {
    ...Font.style('montserrat'),
    color: '#fff',
    fontSize: 18,
    textAlign: 'center'
  }
});
