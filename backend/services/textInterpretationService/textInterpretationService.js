import fs from 'fs/promises';
import path from 'path';

export async function loadMainPrompt() {
  try {
    const apiDefinitions = await getApiDefinitions();
    const promptFileContent = await fs.readFile(process.env.PROMPT_FILE, 'utf-8');
    return `${promptFileContent} \n ${apiDefinitions}`;
  } catch (err) {
    console.error(err);
    throw new Error('Failed to load main prompt');
  }
}

async function getApiDefinitions() {
  try {
    const dirname = process.env.API_DEFINITIONS_PATH;
    const filenames = await fs.readdir(dirname);
    const filesContent = await Promise.all(
      filenames.map(filename => fs.readFile(path.join(dirname, filename), 'utf-8'))
    );
    return filesContent.join('\n --------------- \n');
  } catch (err) {
    console.error(err);
    throw new Error('Failed to get API definitions');
  }
}
