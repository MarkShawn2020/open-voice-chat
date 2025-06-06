import {atom} from "jotai"
import{atomWithImmer} from 'jotai-immer'

export interface IMicrophone {
  id: string
  label: string
  isPermissionGranted: boolean
  isOn: boolean
}

export const isChattingAtom = atom(false)
export const isMicrophoneOnAtom = atom(false)
export const microphonesAtom = atomWithImmer<IMicrophone[]>([])
export const selectedMicrophoneIdAtom = atom<string | null>(null)

// Derived atom for selected microphone with get and set support
export const selectedMicrophoneAtom = atom(
  // Getter: Find the selected microphone from the array using the ID
  (get) => {
    const id = get(selectedMicrophoneIdAtom)
    const mics = get(microphonesAtom)
    return id ? mics.find(mic => mic.id === id) || null : null
  },
  // Setter: Update the selectedMicrophoneId with the new microphone's ID
  (get, set) => {
    return {
      changeId: (id: string) => {
        set(selectedMicrophoneIdAtom, id)
      },
      update: (mic: Partial<Omit<IMicrophone, 'id'>>) => {
        set(microphonesAtom, (draft) => {
          const theMic = draft.find(mic => mic.id === get(selectedMicrophoneIdAtom))
          if (theMic) {
            Object.assign(theMic, mic)
          }
        })
      }
    }
  }
)
