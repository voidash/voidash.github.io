import { ReactElement } from 'react';
import create from 'zustand';


type WindowStore = {
  shouldActivateWindow : boolean,
  windowTitle: string,
  windowContent: ReactElement,
  activateWindow: (title: string,content: ReactElement ) => void,
  disableWindow: () => void
}

const useWindowStore = create<WindowStore>((set) => ({
  shouldActivateWindow: false, 
  windowTitle: "",
  windowContent: <></>,
  activateWindow: (title: string, content: ReactElement) => set(
    (state) => ({
      shouldActivateWindow: true,
      windowTitle: title,
      windowContent: content
    })
    ),
  disableWindow: () => set((state) => ({
      shouldActivateWindow: false
    })

  ),
}));

export default useWindowStore;
