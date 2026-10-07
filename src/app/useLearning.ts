import { useCallback, useLayoutEffect, useState } from "preact/hooks";
import { QUESTION_BANK, type TestConfig } from "../questions";
import {
  STORAGE_KEY, emptyLearning, recordAnswer, restoreLearning, type Session,
} from "./learning";

function readLearning() {
  try { return restoreLearning(localStorage.getItem(STORAGE_KEY), QUESTION_BANK); }
  catch { return emptyLearning(); }
}

export function useLearning() {
  const [data, setData] = useState(readLearning);
  const [storageError, setStorageError] = useState(false);
  useLayoutEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); setStorageError(false); }
    catch { setStorageError(true); }
  }, [data]);
  const record = useCallback((id: string, correct: boolean) => {
    setData(current => ({ ...current, records: recordAnswer(current.records, id, correct) }));
  }, []);
  const saveSession = useCallback((session: Session | null) => {
    setData(current => ({ ...current, session }));
  }, []);
  const saveConfig = (config: TestConfig) => setData(current => ({ ...current, config }));
  return { data, record, saveSession, saveConfig, storageError };
}
