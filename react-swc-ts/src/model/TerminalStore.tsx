import create from 'zustand';

type TerminalStore = {
  shouldActivateTerminal: boolean,
  toggleTerminal : () => void

}

let useTerminalStore = create<TerminalStore>((set) => ({
  shouldActivateTerminal: false, 
  toggleTerminal: () => set((state) => {
      shouldActivateTerminal: !shouldActivateTerminal
    }
  ),
}));


