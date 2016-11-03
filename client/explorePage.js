import React, { Component } from 'react';

import {
  StyleSheet,
  Text,
  View,
  Image,
  AsyncStorage,
  StatusBar
} from 'react-native';
import { Font } from 'exponent';
import { Container, Header, Title, Content, Footer, InputGroup, Input, Button } from 'native-base';
import { Ionicons } from '@exponent/vector-icons';

var STORAGE_KEY = 'id_token';

export default class ExplorePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      fontLoaded: false
    }
  }

  async componentDidMount() {
    await Font.loadAsync({
      'pacifico': require('./assets/fonts/Pacifico.ttf'),
      'montserrat': require('./assets/fonts/Montserrat-Regular.ttf')
    });
    this.setState({ fontLoaded: true });
  }

  render() {
    return (
      <Container>
        <View>

        </View>
      </Container>
    )
  }
}

const styles = StyleSheet.create({

});
