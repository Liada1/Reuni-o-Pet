import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { RascunhoReuniao, MutacaoOutbox } from "./types";

interface PetReunioesDB extends DBSchema {
  outbox: {
    key: number;
    value: MutacaoOutbox;
    indexes: { "by-meeting": string };
  };
  minute_draft: {
    key: string;
    value: RascunhoReuniao;
  };
}

let dbPromise: Promise<IDBPDatabase<PetReunioesDB>> | null = null;

function getDb() {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB indisponível neste ambiente.");
  }
  if (!dbPromise) {
    dbPromise = openDB<PetReunioesDB>("pet-reunioes", 1, {
      upgrade(db) {
        const outbox = db.createObjectStore("outbox", {
          keyPath: "seq",
          autoIncrement: true,
        });
        outbox.createIndex("by-meeting", "meetingId");
        db.createObjectStore("minute_draft", { keyPath: "meetingId" });
      },
    });
  }
  return dbPromise;
}

export async function lerRascunho(meetingId: string): Promise<RascunhoReuniao | undefined> {
  const db = await getDb();
  return db.get("minute_draft", meetingId);
}

export async function salvarRascunho(rascunho: RascunhoReuniao): Promise<void> {
  const db = await getDb();
  await db.put("minute_draft", { ...rascunho, atualizadoEm: Date.now() });
}

export async function enfileirarMutacao(
  mutacao: Omit<MutacaoOutbox, "seq" | "createdAt" | "tentativas">,
): Promise<void> {
  const db = await getDb();
  await db.add("outbox", { ...mutacao, createdAt: Date.now(), tentativas: 0 });
}

export async function listarPendentes(meetingId: string): Promise<MutacaoOutbox[]> {
  const db = await getDb();
  return db.getAllFromIndex("outbox", "by-meeting", meetingId);
}

export async function contarPendentes(meetingId: string): Promise<number> {
  return (await listarPendentes(meetingId)).length;
}

export async function removerMutacao(seq: number): Promise<void> {
  const db = await getDb();
  await db.delete("outbox", seq);
}

export async function incrementarTentativa(mutacao: MutacaoOutbox): Promise<void> {
  const db = await getDb();
  await db.put("outbox", { ...mutacao, tentativas: mutacao.tentativas + 1 });
}
