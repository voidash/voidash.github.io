import { ReactElement } from 'react';
import create from 'zustand';

import { WindowProps } from '../components/DraggableWindow/main';

type WindowStore = {
  windows: Array<WindowProps & {ref: React.RefObject<HTMLDivElement>}>,
  addWindow: (title: string,content: ReactElement,ref: React.RefObject<HTMLDivElement>, disableWindow?: () => void ) => void,
  disableWindow: (curRef: React.RefObject<HTMLDivElement>) => void
}

const useWindowStore = create<WindowStore>((set) => ({
  windows: [],
  addWindow: (title: string, content: ReactElement, ref: React.RefObject<HTMLDivElement>, disableWindow?: () => void) => set(
    (state) => ({
      windows: [...state.windows, {title: title, content: content, ref: ref, disableWindow: disableWindow}]
    })
    ),

  disableWindow: (curRef: React.RefObject<HTMLDivElement>) => set((state) => ({
      windows: [...state.windows.filter((val) => val.ref !== curRef)]
  })

  ),
}));

export default useWindowStore;
