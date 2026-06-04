// src/pages/ingest/assistant/style.ts
import { createStyles } from 'antd-style';

export const useStyles = createStyles(({ css, token }) => ({
  splitter: css`
    height: 100%;
  `,

  chatPanel: css`
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    padding-right: ${token.paddingSM}px;
  `,

  messages: css`
    flex: 1;
    overflow-y: auto;
    padding: ${token.paddingMD}px ${token.paddingSM}px;
    display: flex;
    flex-direction: column;
    gap: ${token.marginMD}px;
  `,

  emptyHint: css`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: ${token.marginSM}px;
    color: ${token.colorTextSecondary};
    text-align: center;
    padding: ${token.paddingLG}px;
  `,

  emptyIcon: css`
    font-size: 40px;
    color: ${token.colorPrimary};
  `,

  senderWrap: css`
    padding: ${token.paddingSM}px ${token.paddingXS}px 0;
    border-top: 1px solid ${token.colorBorderSecondary};
  `,

  resultPanel: css`
    height: 100%;
    overflow-y: auto;
    padding-left: ${token.paddingMD}px;
  `,

  resultEmpty: css`
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  `,
}));
