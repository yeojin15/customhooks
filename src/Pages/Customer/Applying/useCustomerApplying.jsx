import React, { useState } from 'react';
import { Box, Button, Text } from '$atoms';
import { useCommon, useStorage, useTable } from '$hooks';
import { applyingtFilter } from '$page/Customer/Data.Customer';
import { useMutation, useQuery } from 'react-query';
import {
    requestAssosiate,
    requestCustomerApplying,
    requestManager,
} from '$service/customer';
import { viewDate } from '$utils/date';
import TooltipBox from 'src/Common/UI/molecules/TooltipBox/TooltipBox';
import { CUSTOMER_COMPANYS_PAID } from '$page/Customer/Route.Customer';

const useCustomerApplying = () => {
    const { isMaster, assosiateID } = useStorage();
    const { onRefetch, onShowToast, onErrorToast } = useCommon();
    const { checked, filter } = useTable({ filterData: applyingtFilter });
    const [applying, setApplying] = useState();
    const [customerDataCount, setCustomerDataCount] = useState(0);

    // ! 담당자 지정하기
    const defaultAssign = {
        team: false, //소속
        user: false, //담당자
        siteIDs: [],
        siteAssoTeamID: [], // 소속 ID
    };
    const [isAssign, setIsAssign] = useState(defaultAssign);
    const [selectAssign, setSelectAssign] = useState(null);
    const onClickAssign = (siteIDs = [], siteAssoTeamID = []) => {
        setIsAssign({
            ...defaultAssign,
            siteIDs,
            [isMaster ? 'team' : 'user']: true,
            siteAssoTeamID,
        });
    };
    const onCloseAssign = () => {
        setIsAssign(defaultAssign);
    };

    const { isLoading } = useQuery(
        ['customerApplying', filter.filter],
        () =>
            requestCustomerApplying({
                ...filter.filter,
            }),
        {
            onSuccess: ({ success, data, dataTotalCount }) => {
                if (success) {
                    setApplying(data);
                    setCustomerDataCount(dataTotalCount);
                }
            },
        }
    );

    const { mutate: saveAssign } = useMutation(
        isAssign.team ? requestAssosiate : requestManager,
        {
            onSuccess: ({ success, message }) => {
                if (success) {
                    onShowToast('사업장이 배정되었어요');
                    onRefetch(['customerApplying']);
                    setSelectAssign(null);
                    onCloseAssign();
                    checked.resetChecked();
                } else {
                    onErrorToast(message);
                }
            },
        }
    );
    const onSaveAssign = ({ isTeam, id, siteIDs = [] }) => {
        const filter = isTeam
            ? { teamID: id }
            : { manangeAdminUserID: id };
        return saveAssign({
            ...filter,
            siteIDs: [...siteIDs],
        });
    };

    const columns = [
        {
            width: 100,
            title: '서비스 등록번호',
            fontSize: 14,
            color: 'G_300',
            render: ({ siteCode }) => (
                <Text size={'xxxs'} color={'G_300'} weight={400}>
                    {siteCode}
                </Text>
            ),
        },
        {
            title: '실제 사업장명 (법인명)',
            render: ({ corpSiteName, realSiteName }) => (
                <Box column gap={0}>
                    <Text size={'xxs'} color={'G_700'}>
                        {corpSiteName}
                    </Text>
                    <Box padding={[0, 0, 0, 4]}>
                        <Text.Point color={'G_300'} size={14}>
                            {realSiteName
                                ? `(${realSiteName})`
                                : '(법인명)'}
                        </Text.Point>
                    </Box>
                </Box>
            ),
        },
        {
            title: '담당자',
            width: 140,
            render: ({
                adminUserName,
                siteAssoTeamName,
                siteAssoTeamID,
                siteOrgTeamName,
                siteID,
            }) =>
                adminUserName &&
                (siteAssoTeamName || siteOrgTeamName) !== null ? (
                    <Box column gap={8}>
                        <TooltipBox
                            title={adminUserName}
                            subTitle={
                                siteAssoTeamName
                                    ? `(${siteAssoTeamName})`
                                    : ''
                            }
                            desc={
                                siteOrgTeamName
                                    ? `조직 : ${siteOrgTeamName}`
                                    : ''
                            }
                            width={260}>
                            <Text
                                color={'G_600'}
                                $size={'xxxs'}
                                weight={400}>
                                {adminUserName}
                            </Text>
                        </TooltipBox>
                        <Text color={'G_300'}>
                            (
                            {siteOrgTeamName
                                ? siteOrgTeamName
                                : siteAssoTeamName}
                            )
                        </Text>
                    </Box>
                ) : adminUserName === '' &&
                  (siteAssoTeamName || siteOrgTeamName) !== null ? (
                    <>
                        <Button.Text
                            color={`var(--P_500)`}
                            fontSize={14}
                            weight={400}
                            onClick={() =>
                                onClickAssign(
                                    [siteID],
                                    isMaster ? [siteAssoTeamID] : []
                                )
                            }>
                            지정하기
                        </Button.Text>
                        <Text color={'G_300'}>
                            (
                            {siteOrgTeamName
                                ? siteOrgTeamName
                                : siteAssoTeamName}
                            )
                        </Text>
                    </>
                ) : (
                    <Button.Text
                        color={`var(--P_500)`}
                        fontSize={14}
                        weight={400}
                        onClick={() => onClickAssign([siteID])}>
                        지정하기
                    </Button.Text>
                ),
        },
        {
            title: '사업자 등록번호',
            width: 100,
            render: ({ corpRegNumber }) => (
                <Text size={'xxxs'} color={'G_600'} weight={400}>
                    {corpRegNumber ? corpRegNumber : '-'}
                </Text>
            ),
        },
        {
            title: '마지막 작성 일시',
            width: 120,
            render: ({ updateDatetime }) => (
                <Text size={'xxxs'} color={'G_600'} weight={400}>
                    {updateDatetime
                        ? viewDate(updateDatetime)
                        : viewDate()}
                </Text>
            ),
        },
        {
            width: 220,
            title: '가입 신청서',
            render: ({ siteID, subscribeID }) => (
                <Button
                    to={CUSTOMER_COMPANYS_PAID(siteID, subscribeID)}
                    Theme={'line'}
                    size={'lg'}>
                    {'이어서 작성하기'}
                </Button>
            ),
        },
    ];

    return {
        checked,
        applying,
        customerDataCount,
        columns,
        filter,
        isAssign,
        selectAssign,
        assosiateID,
        onCloseAssign,
        setSelectAssign,
        onSaveAssign,
        isLoading,
    };
};

export default useCustomerApplying;
