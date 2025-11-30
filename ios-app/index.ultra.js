// Ultra minimal app without React import
import { registerRootComponent } from 'expo'
import { Text, View } from 'react-native'

function UltraMinimalApp() {
  return View(
    {
      style: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    },
    Text({ style: { fontSize: 20 } }, 'Ultra Minimal Test')
  )
}

registerRootComponent(UltraMinimalApp)
