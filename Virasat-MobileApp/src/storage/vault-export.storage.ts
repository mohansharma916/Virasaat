import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

const exportDirectory = () => new Directory(Paths.cache, 'vault-exports');
let cleanedAtStartup = false;

export function clearTemporaryVaultExports() {
  if (Platform.OS === 'web' || cleanedAtStartup) return;
  const directory = exportDirectory();
  if (directory.exists) directory.delete();
  cleanedAtStartup = true;
}

export function createTemporaryVaultExport(name: string): File {
  const directory = exportDirectory();
  directory.create({ intermediates: true, idempotent: true });
  const file = new File(directory, name);
  file.create({ overwrite: true });
  return file;
}
