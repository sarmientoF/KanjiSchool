// Copyright (c) 2021-2025 Drew Edwards
// This file is part of KanjiSchool under AGPL-3.0.
// Full details: https://github.com/Lemmmy/KanjiSchool/blob/master/LICENSE

import { Input, message, Tooltip } from "antd";

import { menuItemSettingInner } from "./settingsStyles.ts";

const LS_KEY_CUSTOM_TOKEN = "kanjischool-customApiToken";

export function SettingCustomToken(): JSX.Element | null {
  const token = localStorage.getItem(LS_KEY_CUSTOM_TOKEN);
  if (!token) return null;

  function onCopy() {
    navigator.clipboard.writeText(token!);
    message.success("Token copied to clipboard");
  }

  return <div className={menuItemSettingInner}>
    <div className="flex items-center gap-sm">
      <Tooltip title="Click to copy">
        <Input.Password
          value={token}
          readOnly
          onClick={onCopy}
          className="cursor-pointer"
          style={{ minWidth: 280 }}
        />
      </Tooltip>
      <div>Backend token</div>
    </div>
  </div>;
}
