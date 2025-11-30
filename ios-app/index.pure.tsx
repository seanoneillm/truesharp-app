// Pure React Native without Expo
import { AppRegistry, Text, View } from 'react-native'

function PureRNApp() {
  return (
    <View
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}
    >
      <Text style={{ fontSize: 20 }}>Pure React Native Test</Text>
    </View>
  )
}

AppRegistry.registerComponent('main', () => PureRNApp)
