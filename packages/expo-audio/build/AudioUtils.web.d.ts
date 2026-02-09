import { AudioSource, AudioStatus } from './Audio.types';
export declare const nextId: () => number;
export declare function getAudioContext(): AudioContext;
export declare function getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream>;
export declare function getStatusFromMedia(media: HTMLMediaElement, id: number): AudioStatus;
export declare const preloadCache: Map<string, {
    blobUrl: string;
    audio: HTMLAudioElement;
}>;
export declare function getSourceUri(source: AudioSource): string | undefined;
//# sourceMappingURL=AudioUtils.web.d.ts.map