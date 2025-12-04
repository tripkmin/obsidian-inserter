const SERIES_NAVIGATOR_LINES = [
	"",
	"```datacorejsx",
	"const { PATH } = customJS;",
	'const { SeriesNavigator } = await dc.require(',
	'  dc.headerLink(`${PATH.DATACORE_TEMPLATE}/SeriesNavigator.md`, "SeriesNavigator")',
	");",
	"",
	"return function View() {",
	"  return <SeriesNavigator />;",
	"};",
	"```",
	"",
];

export const SERIES_NAVIGATOR_BLOCK = SERIES_NAVIGATOR_LINES.join("\n");
export const SERIES_NAVIGATOR_SNIPPET = SERIES_NAVIGATOR_BLOCK.trim();

const NOTE_HEADER_LINES = [
	"```datacorejsx",
	"const { PATH } = customJS;",
	'const { NoteHeader } = await dc.require(dc.headerLink(`${PATH.DATACORE_TEMPLATE}/NoteHeader.md`, "NoteHeader"));',
	"",
	"return function View(){",
	"\treturn (<NoteHeader />)",
	"}",
	"```",
	"",
];

export const NOTE_HEADER_BLOCK = NOTE_HEADER_LINES.join("\n");
export const NOTE_HEADER_SNIPPET = NOTE_HEADER_BLOCK.trim();

const SOURCE_VIEW_LINES = [
	"```datacorejsx",
	"const { PATH } = customJS;",
	'const { SourceView } = await dc.require(dc.headerLink(`${PATH.DATACORE_TEMPLATE}/SourceView.md`, "SourceView"));',
	"",
	"return function View(){",
	"\treturn (<SourceView />)",
	"}",
	"```",
	"",
];

export const SOURCE_VIEW_SNIPPET = SOURCE_VIEW_LINES.join("\n").trim();
