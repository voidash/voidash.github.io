import { ReactElement } from 'react';
import create from 'zustand';


type WindowStore = {
  shouldActivateWindow : boolean,
  windowTitle: string,
  windowContent: ReactElement,
  activateWindow: (title: string,content: ReactElement ) => void;
}

const useWindowStore = create<WindowStore>((set) => ({
  shouldActivateWindow: false, 
  windowTitle: "",
  windowContent: <></>,
  activateWindow: (title: string, content: ReactElement) => set(
    (state) => ({
      shouldActivateWindow: !state.shouldActivateWindow,
      windowTitle: title,
      windowContent: content
    })
  ),
}));

export  default useWindowStore;
