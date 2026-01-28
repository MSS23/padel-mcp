// Temporary stub until widgets are implemented

export type DisplayMode = 'inline' | 'fullscreen' | 'picture-in-picture';

export function determineDisplayMode(_slots?: any[], _interactionType?: string): DisplayMode {
  return 'inline';
}

export interface WidgetBundle {
  html: string;
  name: string;
  mimeType: 'text/html+skybridge';
}

export async function bundleWidget(_name: string, _props: any): Promise<WidgetBundle> {
  return {
    html: '',
    name: _name,
    mimeType: 'text/html+skybridge',
  };
}
