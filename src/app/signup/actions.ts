'use server'

export async function signup(state: any, formData: FormData) {
  return {
    error: 'Direct registration is disabled. Hedge Capital access is restricted strictly to verified whitelist applicants.'
  }
}
