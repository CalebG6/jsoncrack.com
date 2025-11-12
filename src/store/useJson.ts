// import { create } from "zustand";
// import useGraph from "../features/editor/views/GraphView/stores/useGraph";

// interface JsonActions {
//   setJson: (json: string) => void;
//   getJson: () => string;
//   clear: () => void;
// }

// const initialStates = {
//   json: "{}",
//   loading: true,
// };

// export type JsonStates = typeof initialStates;

// const useJson = create<JsonStates & JsonActions>()((set, get) => ({
//   ...initialStates,
//   getJson: () => get().json,
//   // setJson: json => {
//   //   set({ json, loading: false });
//   //   useGraph.getState().setGraph(json);
//   // },
//   setJson: (json: string | object) => {
//     const jsonString =
//     typeof json === "string" ? json : JSON.stringify(json, null, 2);
//     set({ json: jsonString, loading: false });
//   },
//   clear: () => {
//     set({ json: "", loading: false });
//     useGraph.getState().clearGraph();
//   },
// }));

// export default useJson;

import { create } from "zustand";
import type { JSONPath } from "jsonc-parser";
import useGraph from "../features/editor/views/GraphView/stores/useGraph";

interface JsonActions {
  setJson: (json: string) => void;
  getJson: () => string;
  clear: () => void;
  updateValueAtPath: (path: JSONPath, newValue: any) => void;
}

const initialStates = {
  json: "{}",
  loading: true,
};

export type JsonStates = typeof initialStates;

// Helper function to update a value at a specific path in an object
const updateAtPath = (obj: any, path: JSONPath, newValue: any): any => {
  if (!path || path.length === 0) {
    return newValue;
  }

  const [head, ...tail] = path;
  
  if (Array.isArray(obj)) {
    const newArray = [...obj];
    if (tail.length === 0) {
      newArray[head as number] = newValue;
    } else {
      newArray[head as number] = updateAtPath(obj[head as number], tail, newValue);
    }
    return newArray;
  } else {
    const newObj = { ...obj };
    if (tail.length === 0) {
      newObj[head] = newValue;
    } else {
      newObj[head] = updateAtPath(obj[head], tail, newValue);
    }
    return newObj;
  }
};

const useJson = create<JsonStates & JsonActions>()((set, get) => ({
  ...initialStates,
  getJson: () => get().json,
  setJson: json => {
    set({ json, loading: false });
    useGraph.getState().setGraph(json);
  },
  clear: () => {
    set({ json: "", loading: false });
    useGraph.getState().clearGraph();
  },
  updateValueAtPath: (path: JSONPath, newValue: any) => {
    const currentJson = get().json;
    try {
      const parsedJson = JSON.parse(currentJson);
      const updatedJson = updateAtPath(parsedJson, path, newValue);
      const newJsonString = JSON.stringify(updatedJson, null, 2);
      set({ json: newJsonString });
      useGraph.getState().setGraph(newJsonString);
      
      // Update the left-side text editor
      const useFile = require("./useFile").default;
      useFile.getState().setContents({ contents: newJsonString, hasChanges: true, skipUpdate: true });
    } catch (error) {
      console.error("Error updating JSON at path:", path, error);
    }
  },
}));

export default useJson;
