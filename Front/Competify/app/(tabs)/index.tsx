import { Redirect } from 'expo-router';

export default function HomeScreen() {
  // Redirect to artists (explore) as the main screen
  return <Redirect href="/explore" />;
}
