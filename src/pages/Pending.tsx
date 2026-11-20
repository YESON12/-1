import { TopBar } from '../components/ui';

/** 찬송가·교독문: 데이터 파일 형식을 확인한 뒤 연결할 화면 */
export default function Pending({ title, file }: { title: string; file: string }) {
  return (
    <>
      <TopBar title={title} />
      <div className="page">
        <div className="card notice">
          <h2>준비 중입니다</h2>
          <p>
            {title}은(는) 데이터 파일(<code>{file}</code>)을 가져와서 보여주는 기능입니다. 파일 형식을 확인한 뒤
            다음 업데이트에서 연결됩니다.
          </p>
          {title === '새찬송가' && (
            <p>
              지금은 아래 버튼으로 인터넷에서 악보와 가사를 찾아볼 수 있습니다.
              <br />
              <a className="btn block" href="https://m.search.naver.com/search.naver?query=새찬송가" target="_blank" rel="noreferrer">
                네이버에서 새찬송가 검색
              </a>
            </p>
          )}
        </div>
      </div>
    </>
  );
}
