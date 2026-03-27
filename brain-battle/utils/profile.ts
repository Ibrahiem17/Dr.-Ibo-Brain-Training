import * as SecureStore from 'expo-secure-store'

const USERNAME_KEY = 'dr_ibo_username'
const USER_COLOR_KEY = 'dr_ibo_user_color'
const PROFILE_SET_KEY = 'dr_ibo_profile_set'

export async function saveProfile(username: string, color: string): Promise<void> {
  await SecureStore.setItemAsync(USERNAME_KEY, username.trim())
  await SecureStore.setItemAsync(USER_COLOR_KEY, color)
  await SecureStore.setItemAsync(PROFILE_SET_KEY, 'true')
}

export async function loadUsername(): Promise<string | null> {
  return await SecureStore.getItemAsync(USERNAME_KEY)
}

export async function loadUserColor(): Promise<string> {
  return (await SecureStore.getItemAsync(USER_COLOR_KEY)) ?? '#00e5ff'
}

export async function isProfileSet(): Promise<boolean> {
  const val = await SecureStore.getItemAsync(PROFILE_SET_KEY)
  return val === 'true'
}

export async function updateUsername(newName: string): Promise<void> {
  await SecureStore.setItemAsync(USERNAME_KEY, newName.trim())
}

export async function updateUserColor(color: string): Promise<void> {
  await SecureStore.setItemAsync(USER_COLOR_KEY, color)
}

export async function deleteProfile(): Promise<void> {
  await SecureStore.deleteItemAsync(USERNAME_KEY)
  await SecureStore.deleteItemAsync(USER_COLOR_KEY)
  await SecureStore.deleteItemAsync(PROFILE_SET_KEY)
}
