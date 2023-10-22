import {
  Message,
  Modal,
  Table,
  TableColumnProps,
} from '@arco-design/web-react';
import { useContext, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import styled from 'styled-components';
import { IconDelete, IconEmpty } from '@arco-design/web-react/icon';
import localCache, {
  PROBLEM_STATUS,
  ProblemRecord,
} from '@src/utils/local-cache';
import Context from '@src/utils/context';
import emitter from '@src/utils/emit';
import Markdown from '@src/components/Markdown';
import i18nJson from '@config/i18n.json';
import styles from './index.module.less';

const Accepted = styled.div`
  font-weight: 500;
  color: rgb(var(--green-6));
`;

const UnAccepted = styled.div`
  font-weight: 500;
  color: rgb(var(--red-6));
`;

const ViewCode = function (props: { code: string }) {
  const { code } = props;
  const [
    {
      setting: { language },
    },
  ] = useContext(Context);
  const [
    {
      setting: { theme },
    },
  ] = useContext(Context);
  const [visible, setVisible] = useState(false);
  return (
    <>
      <a onClick={() => setVisible(true)}>{i18nJson['view'][language]}</a>
      <Modal
        simple={true}
        footer={null}
        visible={visible}
        onCancel={() => setVisible(false)}
        style={{ width: 'fit-content' }}
      >
        <Markdown content={`\`\`\`typescript\n${code}\n\`\`\``} theme={theme} />
      </Modal>
    </>
  );
};

const Records = function () {
  const [{ currentProblem, setting }] = useContext(Context);
  const [state, setState] = useState(false);

  const columns: TableColumnProps[] = [
    {
      dataIndex: 'status',
      title: i18nJson['status'][setting.language],
      render(status: PROBLEM_STATUS) {
        if (status === PROBLEM_STATUS.accepted) {
          return <Accepted>Accepted</Accepted>;
        } else {
          return <UnAccepted>Compilation Error</UnAccepted>;
        }
      },
    },
    {
      dataIndex: 'time',
      title: i18nJson['time'][setting.language],
      render(time: number) {
        return dayjs(time).format('YYYY-MM-DD HH:mm:ss');
      },
    },
    {
      dataIndex: 'code',
      title: i18nJson['code'][setting.language],
      render(_, item: ProblemRecord) {
        return <ViewCode code={item.code} />;
      },
    },
    {
      dataIndex: 'options',
      title: i18nJson['options'][setting.language],
      render(
        _,
        item: {
          code: string;
        },
      ) {
        return (
          <CopyToClipboard
            text={item.code}
            onCopy={() => Message.success('Copied!')}
          >
            <a>{i18nJson['copy'][setting.language]}</a>
          </CopyToClipboard>
        );
      },
    },
    {
      dataIndex: 'operate',
      title: i18nJson['operate'][setting.language],
      render(_, item: ProblemRecord & { problem: string }) {
        return (
          <a
            style={{ display: 'flex', alignItems: 'center' }}
            onClick={function () {
              const success = localCache.deleteProblemRecord(
                item.problem,
                item.time,
              );
              if (success) {
                emitter.emit('delete-problem-record');
                Message.success(
                  i18nJson['successfully_delete'][setting.language],
                );
              } else Message.error(i18nJson['failed_delete'][setting.language]);
            }}
          >
            <IconDelete
              style={{ width: 18, height: 18, color: 'rgb(var(--red-6))' }}
            />
          </a>
        );
      },
    },
  ];

  useEffect(function () {
    emitter.on('submit-code', () => setState(prev => !prev));
    emitter.on('delete-problem-record', () => setState(prev => !prev));
  }, []);

  const records = useMemo(
    function () {
      const cacheJson = localCache.getProblemCacheJson();
      const { records = [] } = cacheJson[currentProblem.key] || {};
      records.sort((recordX, recordY) => recordY.time - recordX.time);
      return records.map(function (record) {
        const { time } = record;
        return {
          key: time,
          ...record,
          problem: currentProblem.key,
        };
      });
    },
    [currentProblem, state],
  );

  return (
    <div className={styles['records-container']}>
      <Table
        className={styles['records-table']}
        columns={columns}
        data={records}
        stripe={true}
        pagination={false}
        noDataElement={
          <div className={'arco-table-no-data'}>
            <div className={'arco-empty'}>
              <div className={'arco-empty-wrapper'}>
                <div className={'arco-empty-image'}>
                  <IconEmpty />
                </div>
                <div className={'arco-empty-description'}>
                  {i18nJson['no_data'][setting.language]}
                </div>
              </div>
            </div>
          </div>
        }
      />
      <div className={styles['record-tip']}>
        Tips: {i18nJson['record_tip'][setting.language]}
      </div>
    </div>
  );
};

export default Records;
