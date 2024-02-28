import { ReactElement } from 'react';
import create from 'zustand';

import { WindowProps } from '../components/DraggableWindow/main';

type WindowStore = {
  windows: Array<WindowProps>,
  winCount: number,
  addWindow: (title: string,content: ReactElement, disableWindow?: () => void ) => void,
  disableWindow: (id:number) => void
}

const useWindowStore = create<WindowStore>((set) => ({
  windows: [],
  winCount: 0,
  addWindow: (title: string, content: ReactElement,disableWindow?: () => void) => set(
    (state) => ({
      windows: [...state.windows, {id: state.winCount ,title: title, content: content, disableWindow: disableWindow}],
      winCount: state.winCount + 1
    })
    ),

  disableWindow: (id: number) => set((state) => {
    return {
        windows: [...(state.windows.filter((val) =>  {return val.id !== id;}))],
        winCount: state.winCount
    }
  }
  ),
}));

export default useWindowStore;
