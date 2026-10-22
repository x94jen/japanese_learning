import { createContext, useContext, Fragment } from "react";
import readings from "./readings.json";
export type JapaneseToken = { text: string; reading?: string };
export const readingMap = readings as Record<string, JapaneseToken[]>;
export const RubyContext = createContext(true);
export function RubyToken({
  token,
  enabled = true,
}: {
  token: JapaneseToken;
  enabled?: boolean;
}) {
  return enabled && token.reading ? (
    <ruby>
      {token.text}
      <rt>{token.reading}</rt>
    </ruby>
  ) : (
    <>{token.text}</>
  );
}
export function JP({
  text,
  ruby = true,
  className = "",
}: {
  text: string;
  ruby?: boolean;
  className?: string;
}) {
  const enabled = useContext(RubyContext) && ruby;
  return (
    <span lang="ja" className={`jp ${className}`}>
      {enabled
        ? (readingMap[text] || [{ text }]).map((p, i) => (
            <Fragment key={i}>
              <RubyToken token={p} />
            </Fragment>
          ))
        : text}
    </span>
  );
}
