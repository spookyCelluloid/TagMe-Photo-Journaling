import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  AlertIOS,
  AsyncStorage,
  StatusBar
} from 'react-native';
import { Font } from 'exponent';
import { Container, Header, Title, Content, Footer, Button, List, ListItem, Input, InputGroup } from 'native-base';
import { Ionicons } from '@exponent/vector-icons';

var STORAGE_KEY = 'id_token';

export default class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      fontLoaded: false,
      username: '',
      password: ''
    }
  }

  async componentDidMount() {
    await Font.loadAsync({
      'pacifico': require('./assets/fonts/Pacifico.ttf'),
      'montserrat': require('./assets/fonts/Montserrat-Regular.ttf')
    });
    this.setState({ fontLoaded: true });
  }

  _navigate(username) {
    this.props.navigator.push({
      name: 'Homescreen',
      passProps: {
        'username': username
      }
    })
  }

  async _onValueChange(item, selectedValue) {
    try {
      await AsyncStorage.setItem(item, selectedValue);
      console.log('token saved!');
    } catch (error) {
      console.log('AsyncStorage error: ' + error.message);
    }
  }

  login() {
    var context = this;

    if (this.state.username && this.state.password) {
      fetch('https://invalid-memories-greenfield.herokuapp.com/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: this.state.username,
          password: this.state.password
        })
      })
      .then(function(response) {
        var username = context.state.username;
        context.clearInput();
        if (response.status === 201) {
          var token = JSON.parse(response._bodyText).id_token;
          return context._onValueChange(STORAGE_KEY, token)
            .then(function() {
              context._navigate(username);
            });
        } else {
          AlertIOS.alert('Invalid username/password.');
        }
      });
    } else {
      AlertIOS.alert('Username and password required.');
    }
  }

  signup() {
    var context = this;

    if (this.state.username && this.state.password) {
      fetch('https://invalid-memories-greenfield.herokuapp.com/api/users/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: this.state.username,
          password: this.state.password
        })
      })
      .then(function(response) {
        var username = context.state.username;
        context.clearInput();
        if (response.status === 201) {
          var token = JSON.parse(response._bodyText).id_token;
          return context._onValueChange(STORAGE_KEY, token)
            .then(function() {
              context._navigate(username);
            });
        } else {
          AlertIOS.alert('Username already exists.');
        }
      });
    } else {
      AlertIOS.alert('Username and password required.');
    }
  }

  clearInput() {
    this.setState({username: '', password: ''});
  }

  render() {
    return (
      <Container>
        <View>
          <StatusBar
            backgroundColor='black'/>
        </View>
        <View style={styles.backgroundImageWrapper}>
          <Image source={require('./assets/images/london.jpg')} style={styles.backgroundImage} />
        </View>
        <View style={styles.container}>
          {
            this.state.fontLoaded ? (
            <View>
              <View style={styles.title}>
                <Text style={styles.titleText}>TagMe</Text>
              </View>

            </View>
            ) : null
          }
          <List style={{marginRight:20}}>
            <ListItem>
              <InputGroup>
                <Input
                  placeholder='USERNAME'
                  placeholderTextColor='#444'
                  onChangeText={(text) => this.setState({username: text})}
                  value={this.state.username}
                  style={styles.formText}
                />
              </InputGroup>
            </ListItem>
            <ListItem>
              <InputGroup>
                <Input
                  placeholder='PASSWORD'
                  placeholderTextColor='#444'
                  secureTextEntry={true}
                  onChangeText={(text) => this.setState({password: text})}
                  value={this.state.password}
                  style={styles.formText}
                />
              </InputGroup>
            </ListItem>
          </List>
          {
            this.state.fontLoaded ? (
            <View style={styles.buttonsContainer}>
              <Button primary style={styles.button} onPress={this.login.bind(this)}>
                <Text style={styles.buttonText}>
                  Login <Ionicons name="ios-log-in" size={23} color="white" />
                </Text>
              </Button>

              <Button primary style={styles.button} onPress={this.signup.bind(this)}>
                <Text style={styles.buttonText}>
                  Signup <Ionicons name="ios-person-add-outline" size={25} color="white" />
                </Text>
              </Button>
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
    alignItems: 'center'
  },

  backgroundImage: {
    flex: 1,
    resizeMode: 'stretch'
  },

  container: {
    flex: 1,
  },

  buttonsContainer: {
    flexDirection: 'row',
    marginTop: 50,
    justifyContent: 'center',
    alignItems: 'center'
  },

  title: {
    marginTop: 100,
    marginBottom: 10,
    alignItems: 'center'
  },

  titleText: {
    ...Font.style('pacifico'),
    color: '#f6755e',
    fontSize: 80
  },

  subtitle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40
  },

  subtitleText: {
    color: '#25a2c3',
    fontSize: 16,
    textAlign: 'center',
    height: 30,
    borderColor: '#aaa',
    borderRadius: 15,
    borderWidth: 1,
    paddingTop: 5,
    paddingRight: 8,
    paddingLeft: 8,
    marginRight: 3,
    marginLeft: 3
  },

  formText: {
    fontSize: 17,
    color: '#333'
  },

  button: {
    backgroundColor: '#f6755e',
    height: 45,
    width: 100,
    marginRight: 10,
    marginLeft: 10
  },

  buttonText: {
    ...Font.style('montserrat'),
    color: '#fff',
    fontSize: 18,
    marginBottom: 5
  }
});
