// Minimal test entry point
import { registerRootComponent } from 'expo'
import { Text, View } from 'react-native'

function MinimalApp() {
  return (
    <View
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}
    >
      <Text style={{ fontSize: 20 }}>Minimal Test App</Text>
    </View>
  )
}

registerRootComponent(MinimalApp)
