import React, { useContext, useEffect, useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import styled, { ThemeContext } from 'styled-components';
import { Container } from '../components/styled/CustomBsGrid';
import PieChart from '../components/chart-types/PieChart';
import API from '../api';
import TransactionsTable from '../components/transactions/TransactionsTable';
import TemplateCard from '../components/reusable/TemplateCard';
import Card from '../components/styled/Card';
import Subtitle from '../components/styled/Subtitle';
import { formatToken, formatPercentDec2, formatUSD } from '../utils';
import useRequestForSearch from '../hooks/useRequestForSearch';
import useRequest from '../hooks/useRequest';

const CardWrapper = styled(Card.Body)`
  display: grid;
  grid-template-columns: 55% 43%;
  gap: 1rem;
  justify-content: center;
  padding: 1rem;

  @media (max-width: ${({ theme }) => theme.xlDown}) {
    display: flex;
    flex-direction: column;
  }
`;

const GridWrapperTable = styled.div`
  grid-column: span 2;
`;

const accDetailsList = [
  {
    key: 'address',
    label: 'Address',
  },
  {
    key: 'balance',
    label: 'Available Balance',
  },
  {
    key: 'delegated',
    label: 'Delegated',
  },
  {
    key: 'unbonding',
    label: 'Unbonding',
  },
  {
    key: 'stake_reward',
    label: 'Staking Rewards',
  },
  {
    key: 'total_amount',
    label: 'Total amount',
  },
];

const arr = [
  {
    key: 'balance',
    label: 'Available Balance',
    title: 'Available Balance',
  },
  {
    key: 'delegated',
    label: 'Delegated',
    title: 'Delegated',
  },
  {
    key: 'unbonding',
    label: 'Unbonding',
    title: 'Unbonding',
  },
  {
    key: 'stake_reward',
    label: 'Staking Rewards',
    title: 'Staking Rewards',
  },
];

const valFormatter = (val, total) =>
  `${formatToken(val)}(${formatPercentDec2((val * 100) / total)})`;

const labelFormatter = (entry) => `${formatToken(entry.value)}`;

const AccountDetails = () => {
  const theme = useContext(ThemeContext);
  const { state } = useLocation();
  const { address } = useParams();
  const { resp, isLoading } = useRequestForSearch(
    API.getAccountDetails,
    address,
    state,
  );
  const trxAccount = useRequest(API.getTransactionList, {
    limit: 10,
    offset: 0,
    address,
  });
  const stats = useRequest(API.getMetaStats, {});

  useEffect(() => {
    stats.request();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const price = useMemo(() => {
    if (!stats.resp) return 0;

    return +stats.resp.current_price;
  }, [stats.resp]);

  const accountDetails = useMemo(() => {
    if (!resp || !Object.keys(resp).length) return [];

    let totalAmount = 0;
    Object.keys(resp).forEach((e) => {
      if (Number.isFinite(Number(resp[e]))) {
        totalAmount += Number(resp[e]);
      }
    });

    const items = accDetailsList.map((elem) => {
      if (elem.key === 'total_amount') {
        const total =
          Number(resp.stake_reward) +
          Number(resp.balance) +
          Number(resp.delegated);

        return {
          key: elem.key,
          label: elem.label.toLocaleUpperCase(),
          value: `${formatToken(total)} / ${formatUSD(total * price)}`,
        };
      }

      return {
        key: elem.key,
        label: elem.label.toLocaleUpperCase(),
        value: Number.isFinite(Number(resp[elem.key]))
          ? `${formatToken(+resp[elem.key])}`
          : resp[elem.key],
      };
    });

    let chartData = arr.map((e) => {
      return { ...e, value: Number(resp[e.key]) };
    });

    if (!totalAmount) {
      chartData = [
        {
          key: 'not_data',
          label: 'Not data',
          title: 'Not data',
          value: 0.000000001,
        },
      ];
    }

    return {
      items,
      chartData,
      totalAmount,
    };
  }, [resp, price]);

  const trx = useMemo(() => {
    if (!trxAccount.resp || !Object.keys(trxAccount.resp).length) return {};

    return trxAccount;
  }, [trxAccount]);

  return (
    <Container>
      <Card>
        <Card.Header>
          <Subtitle>Account details</Subtitle>
        </Card.Header>

        <CardWrapper>
          <TemplateCard
            items={accountDetails.items}
            isLoading={isLoading || stats.isLoading}
          />

          <Card className="p-2">
            <PieChart
              isLoading={isLoading}
              data={accountDetails.chartData}
              valFormatter={(val) =>
                valFormatter(val, accountDetails.totalAmount)
              }
              labelFormatter={labelFormatter}
              height={250}
              minAngle={7}
              isAnimationActive={false}
              displayLegend={!!accountDetails.totalAmount && true}
              displayTooltip={!!accountDetails.totalAmount && true}
              growOnMobile={false}
              cellColors={[
                theme.blue,
                theme.violet,
                theme.burgundy,
                theme.grey,
              ]}
            />
          </Card>

          <GridWrapperTable>
            <TransactionsTable
              resp={trx.resp}
              isLoading={trxAccount.isLoading}
              request={trxAccount.request}
            />
          </GridWrapperTable>
        </CardWrapper>
      </Card>
    </Container>
  );
};

export default AccountDetails;
