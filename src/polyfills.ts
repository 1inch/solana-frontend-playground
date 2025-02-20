// Define global first
(window as any).global = window;

// Then import Buffer and assign it
import { Buffer } from 'buffer';
(window as any).Buffer = Buffer;
