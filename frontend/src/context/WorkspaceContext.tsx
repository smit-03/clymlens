/* eslint-disable react-refresh/only-export-components -- context module: provider + hook belong together */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ApiError } from "../api/client";
import type {
  FileInfo,
  OpenMeteoArchive,
  StoreWeatherRequest,
  StoreWeatherResponse,
} from "../api/types";
import { getWeatherFileContent, listWeatherFiles, storeWeatherData } from "../api/weather";
import { useAsync, type AsyncStatus } from "../hooks/useAsync";

interface WorkspaceValue {
  files: FileInfo[];
  filesStatus: AsyncStatus;
  filesError: ApiError | null;
  refreshFiles: () => Promise<void>;

  selectedFile: string | null;
  selectFile: (name: string) => void;
  reloadContent: () => void;
  content: OpenMeteoArchive | null;
  contentStatus: AsyncStatus;
  contentError: ApiError | null;

  submitQuery: (body: StoreWeatherRequest) => Promise<StoreWeatherResponse>;
  storeStatus: AsyncStatus;
  storeError: ApiError | null;
  lastStored: StoreWeatherResponse | null;
}

const WorkspaceContext = createContext<WorkspaceValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const files = useAsync(listWeatherFiles);
  const fileContent = useAsync(getWeatherFileContent);
  const store = useAsync(storeWeatherData);
  const { run: runListFiles } = files;
  const { run: runFileContent } = fileContent;
  const { run: runStore } = store;

  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const refreshFiles = useCallback(async () => {
    await runListFiles().catch(() => undefined);
  }, [runListFiles]);

  useEffect(() => {
    void refreshFiles();
  }, [refreshFiles]);

  const selectFile = useCallback((name: string) => setSelectedFile(name), []);

  const reloadContent = useCallback(() => {
    if (selectedFile) void runFileContent(selectedFile).catch(() => undefined);
  }, [selectedFile, runFileContent]);

  useEffect(() => {
    if (!selectedFile) return;
    void runFileContent(selectedFile).catch(() => undefined);
  }, [selectedFile, runFileContent]);

  const submitQuery = useCallback(
    async (body: StoreWeatherRequest) => {
      const result = await runStore(body);
      await refreshFiles();
      setSelectedFile(result.file);
      return result;
    },
    [runStore, refreshFiles],
  );

  const value = useMemo<WorkspaceValue>(
    () => ({
      files: files.data?.files ?? [],
      filesStatus: files.status,
      filesError: files.error,
      refreshFiles,

      selectedFile,
      selectFile,
      reloadContent,
      content: fileContent.data,
      contentStatus: fileContent.status,
      contentError: fileContent.error,

      submitQuery,
      storeStatus: store.status,
      storeError: store.error,
      lastStored: store.data,
    }),
    [
      files.data,
      files.status,
      files.error,
      refreshFiles,
      selectedFile,
      selectFile,
      reloadContent,
      fileContent.data,
      fileContent.status,
      fileContent.error,
      submitQuery,
      store.status,
      store.error,
      store.data,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceValue {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("useWorkspace must be used within a WorkspaceProvider");
  return value;
}
