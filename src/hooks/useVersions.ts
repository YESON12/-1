import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useSettings } from '../settings';

/** 보유 역본 목록과 현재 기본 역본 코드. versions가 undefined면 아직 불러오는 중. */
export function useVersions() {
  const { settings } = useSettings();
  const versions = useLiveQuery(() => db.versions.orderBy('code').toArray(), []);
  const primary =
    versions?.find((v) => v.code === settings.primaryVersion)?.code ?? versions?.[0]?.code ?? undefined;
  return { versions, primary };
}
