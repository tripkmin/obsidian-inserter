# Obsidian Inserter

기존 `references/` 폴더에 있던 Python 스크립트 네 가지를 그대로 옮겨, 옵시디언 명령 팔레트에서 실행할 수 있도록 만든 플러그인입니다. 활성화된 노트가 속한 폴더를 기준으로 모든 Markdown 파일을 처리합니다.

## 제공 명령

모든 명령은 `Ctrl + P`로 명령 팔레트를 연 뒤 이름을 입력하면 실행할 수 있습니다.

-   `현재 폴더에 Series Navigator 블록 추가`  
    폴더에 있는 모든 Markdown 문서의 끝에 Datacore `SeriesNavigator` JSX 블록을 추가합니다. 이미 동일한 블록이 있는 문서는 건너뜁니다.
-   `현재 폴더에 Source View 블록 삽입`  
    각 문서의 frontmatter 뒤(가능하면 첫 번째 H1 바로 뒤)에 `SourceView` JSX 블록을 삽입합니다. 이미 블록이 있는 문서는 건너뜁니다.
-   `현재 폴더 정렬: sourceDate 기준`  
    frontmatter 안의 `sourceDate` 값을 기준으로 모든 문서의 `order` 값을 재정렬합니다. `sourceDate`가 없는 문서는 건너뜁니다.
-   `현재 폴더 정렬: 제목 기준`  
    frontmatter 의 `title` 값을 기준으로 `order` 값을 재정렬합니다. `title`이 없으면 파일명을 대신 사용합니다.
-   `현재 폴더 order 값 정수 재정렬`  
    소수점/중복이 섞여 있는 기존 `order` 값을 모두 1부터 시작하는 정수로 재정렬합니다. `order` 값이 같으면 파일명을 기준으로 오름차순 정렬합니다.

각 명령은 완료 후 결과를 알림으로 보여주며, 처리 중 문제가 있는 문서는 콘솔 경고로 확인할 수 있습니다.
`order` 값을 수정하는 명령은 실행 전에 폴더 내에 기존 `order` 값이 있음을 알려 주고, 계속 진행할지 사용자에게 확인을 요청합니다.

## 설치 및 개발

1. 저장소를 클론합니다.
2. `npm install`로 의존성을 설치합니다.
3. 개발용 번들을 위해 `npm run dev`, 배포용 번들을 위해 `npm run build`를 실행합니다.
4. `main.js`, `manifest.json`, `styles.css`(선택)를 원하는 볼트의 `.obsidian/plugins/obsidian-inserter/` 로 복사하면 수동 설치가 완료됩니다.
