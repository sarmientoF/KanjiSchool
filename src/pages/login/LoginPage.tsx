// Copyright (c) 2021-2025 Drew Edwards
// This file is part of KanjiSchool under AGPL-3.0.
// Full details: https://github.com/Lemmmy/KanjiSchool/blob/master/LICENSE

import { useState } from "react";
import { Form, Input, Button, Row, Col, Divider, Tabs, Checkbox } from "antd";
import useBreakpoint from "antd/es/grid/hooks/useBreakpoint";

import { AppLoading } from "@global/AppLoading";
import { PageLayout } from "@layout/PageLayout";

import * as api from "@api";

import { SimpleCard } from "@comp/SimpleCard.tsx";
import { ExtLink } from "@comp/ExtLink";
import { DemoCarousel } from "./DemoCarousel";
import { AttributionFooter } from "@layout/AttributionFooter.tsx";

const UUID_RE = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;

const CONFIGURED_API_URL: string | undefined = import.meta.env.VITE_API_URL;

interface WaniKaniFormValues {
  apiKey: string;
  migrate: boolean;
}

interface TokenFormValues {
  token: string;
}

function WaniKaniLoginForm(): JSX.Element {
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginFailed, setLoginFailed] = useState(false);
  const [form] = Form.useForm<WaniKaniFormValues>();

  async function onSubmit() {
    const values = await form.validateFields();
    try {
      setLoggingIn(true);
      setLoginFailed(false);
      await api.attemptLogIn(values.apiKey, { migrate: values.migrate });
    } catch (err: any) {
      console.error("login failed:", err);
      setLoginFailed(true);
    } finally {
      setLoggingIn(false);
    }
  }

  if (loggingIn) return <AppLoading title="Logging in..." />;

  return <Form
    form={form}
    layout="vertical"
    initialValues={{ apiKey: "", migrate: false }}
    onFinish={onSubmit}
    className="w-full"
  >
    {/* Fake username for autofill */}
    <Input
      type="username"
      id="username"
      name="username"
      autoComplete="username"
      value="WaniKani API Key"
      className="absolute pointer-events-none opacity-0"
    />

    <div className="flex gap-sm items-start">
      {/* API key */}
      <Form.Item
        name="apiKey"
        label="API Key"
        required
        rules={[{ pattern: UUID_RE, message: "Must be a valid API key" }]}
        validateStatus={loginFailed ? "error" : undefined}
        help={loginFailed ? "Login failed, incorrect API key?" : undefined}
        className="!flex-1 !mb-0"
      >
        <Input
          type="password"
          name="apiKey"
          placeholder="API Key"
          autoComplete="current-password"
        />
      </Form.Item>

      <Button type="primary" onClick={onSubmit} className="mt-[30px]">
        Log in
      </Button>
    </div>

    {/* Migrate checkbox — only when a custom backend is configured */}
    {CONFIGURED_API_URL && <Form.Item name="migrate" valuePropName="checked" className="!mb-0 mt-sm">
      <Checkbox>Migrate to custom backend</Checkbox>
    </Form.Item>}
  </Form>;
}

function TokenLoginForm(): JSX.Element {
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginFailed, setLoginFailed] = useState(false);
  const [form] = Form.useForm<TokenFormValues>();

  async function onSubmit() {
    const values = await form.validateFields();
    try {
      setLoggingIn(true);
      setLoginFailed(false);
      await api.attemptLogInWithToken(values.token);
    } catch (err: any) {
      console.error("token login failed:", err);
      setLoginFailed(true);
    } finally {
      setLoggingIn(false);
    }
  }

  if (loggingIn) return <AppLoading title="Logging in..." />;

  return <Form
    form={form}
    layout="vertical"
    initialValues={{ token: "" }}
    onFinish={onSubmit}
    className="w-full"
  >
    <div className="flex gap-sm items-start">
      <Form.Item
        name="token"
        label="Backend Token"
        required
        validateStatus={loginFailed ? "error" : undefined}
        help={loginFailed ? "Login failed, invalid token?" : undefined}
        className="!flex-1 !mb-0"
      >
        <Input
          type="password"
          name="token"
          placeholder="Token"
          autoComplete="current-password"
        />
      </Form.Item>

      <Button type="primary" onClick={onSubmit} className="mt-[30px]">
        Log in
      </Button>
    </div>
  </Form>;
}

export function LoginPage(): JSX.Element {
  const { md } = useBreakpoint();

  return <PageLayout
    siteTitle="Log in"
    noHeader
    verticallyCentered
    contentsHeightClassName="h-auto min-h-screen"
  >
    <SimpleCard title="KanjiSchool" className="min-w-[300px] w-full max-w-[720px] box-border relative">
      {/* Top section - lead text and carousel */}
      <Row>
        <Col flex="1">
          <p className="mt-0 text-justify">
            Welcome to KanjiSchool, a client for <ExtLink href="https://www.wanikani.com">WaniKani</ExtLink>, an SRS
            kanji learning app created by <ExtLink href="https://www.tofugu.com">Tofugu</ExtLink>.
          </p>
          <p className="mb-0 text-justify">
            The client is fully-featured and supports additional
            functionality such as self-study reviews, mobile support, and
            offline mode.
          </p>
        </Col>
        {md && <Col flex="200px"><DemoCarousel /></Col>}
      </Row>

      <Divider />

      {/* Onboarding */}
      <p className="text-justify">
        To get started, enter your <ExtLink href="https://www.wanikani.com/settings/personal_access_tokens">WaniKani
        API v2 key</ExtLink>.
        Permissions required:
      </p>

      <ul className="mt-0 grid grid-cols-1 md:grid-cols-2 gap-0.5 md:gap-xs">
        <li><code>assignments:start</code></li>
        <li><code>reviews:create</code></li>
        <li><code>study_materials:create</code></li>
        <li><code>study_materials:update</code></li>
      </ul>

      <p className="text-desc text-justify">
        If you don&apos;t have a WaniKani account yet, create
        one <ExtLink href="https://www.wanikani.com">here</ExtLink>.
      </p>

      {/* Login form — tabbed when custom backend is configured */}
      {CONFIGURED_API_URL
        ? <Tabs items={[
            { key: "wanikani", label: "WaniKani", children: <WaniKaniLoginForm /> },
            { key: "token",    label: "Already migrated", children: <TokenLoginForm /> },
          ]} />
        : <WaniKaniLoginForm />
      }

      {/* Carousel on mobile */}
      {!md && <>
        <Divider />
        <Row className="mt-lg justify-center">
          <Col><DemoCarousel /></Col>
        </Row>
      </>}
    </SimpleCard>

    <AttributionFooter
      withThemeToggle
      className="max-w-[720px] mt-5 mx-auto"
    />
  </PageLayout>;
}
