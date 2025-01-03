import { ReactElement, useRef } from 'react';
import create from 'zustand';

import { WindowProps } from '../components/DraggableWindow/main';
import React from 'react';

type WindowStore = {
  windows: Array<WindowProps>,
  addWindow: (url:string, title: string, content: ReactElement, disableWindow?: () => void ) => any,
  disableWindow: (url: string) => void,
  disableRecent: () => void
}

const useWindowStore = create<WindowStore>((set) => ({
  windows: [],
  addWindow: (url: string, title: string, content: ReactElement, disableWindow?: () => void) => {
  if (window.location.pathname !== url) {
    history.pushState({page: url}, url,  url);
  }

  set(
    (state) => {
       let found_windows = state.windows.find((st: any) =>  {
            return st.url == url;
       });
        // if we have no previous windows for that url, add it
        if (found_windows == undefined) {
           let newState = {
              url: url,
              title: title,
              sref: React.createRef<HTMLDivElement>(),
              content: content,
              disableWindow: disableWindow
            }
           return { windows: [...state.windows, newState] };
        }
        return { windows: state.windows }
      });
  },

  disableWindow: (url: string) => {
    history.back();
    set((state) => {
      return {
          windows: [...(state.windows.filter((val) =>  {return val.url !== url;}))],
      }
    }
    )
  },
  disableRecent: () => {
      set((state) => {
        let current = state.windows.splice(-1);
        if (current.length != 0) {
            current[0].sref.current!.style.display = "None";
        }

        return {
            windows: state.windows,
        }
      }
    )
    }
}));

export default useWindowStore;
