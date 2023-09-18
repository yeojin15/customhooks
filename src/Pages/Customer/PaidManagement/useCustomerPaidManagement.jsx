import { useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { Badge, Box, Button, InputComponent, Text } from '$atoms';
import {
    requestAssosiate,
    requestPaidDataLoad,
    requestPaidManagementLoad,
    requestPaidUpdate,
    requestManager,
} from '$service/customer';
import { paidManagementStatus, uploadStatus } from '$data/status';
import { paidManagementFilter } from '$page/Customer/Data.Customer';
import { useCommon, useStorage, useTable } from '$hooks';
import { viewDay } from '$utils/date';
import TooltipBox from 'src/Common/UI/molecules/TooltipBox/TooltipBox';
import { CUSTOMER_PAID_MANAGEMENT_DETAIL_COMPANY } from '$page/Customer/Route.Customer';
import useExcelDownload from '$page/Customer/Components/Excel/useExcelDownload';
import useExcelDataCount from '$page/Customer/Components/Excel/useExcelDataCount';
import useExcelUpload from '$page/Customer/Components/Excel/useExcelUpload';
import useUnsuitableOnChange from '$page/Customer/Components/Excel/OnChange/useUnsuitableOnChange';
import useExcelResultDataCount from '$page/Customer/Components/Excel/useExcelResultDataCount';
import useResultUpdate from '$page/Customer/Components/Excel/useResultUpdate';

const useCustomerPaidManagement = () => {
    // ! 공통 필요한 로직
    const { checked, filter } = useTable({
        filterData: paidManagementFilter,
    });
    const { isMaster, isTopMaster, assosiateID } = useStorage();
    const { modalHandler, onRefetch, onShowToast, onErrorToast } =
        useCommon();
    const [isUpload, setIsUpload] = useState(false); // isUpload ? 유료가입신청업로드 : 초기리스트
    const [customerData, setCustomerData] = useState(); // 유료가입신청 뷰 데이터
    const [cusUploadData, setCusUploadData] = useState(); // 유료가입신청 업로드 파일 뷰 데이터
    const [customerDataCount, setCustomerDataCount] = useState(0); //필터링 전 전체 데이터카운트

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
        ['customerPaidManagement', filter.filter],
        () => requestPaidManagementLoad({ ...filter.filter }),
        {
            onSuccess: ({ data, dataTotalCount }) => {
                setCustomerData(data);
                setCustomerDataCount(dataTotalCount);
            },
        }
    );
    const { mutate: saveAssign } = useMutation(
        isAssign.team ? requestAssosiate : requestManager,
        {
            onSuccess: ({ success, message }) => {
                if (success) {
                    onShowToast('사업장이 배정되었어요');
                    onRefetch(['customerPaidManagement']);
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

    // ! 엑셀 다운로드 로직 (O)
    const [excelDataCount, setExcelDataCount] = useState(0);
    const excelDownModal = modalHandler('excelDownModal');
    const { excelDownFunc } = useExcelDownload(
        excelDownModal,
        '스마플 유료 가입 신청서.xlsx',
        0
    );
    // 청구 심사 엑셀 다운로드 하기 전 데이터 카운트하기
    const { excelDataCountFunc } = useExcelDataCount(setExcelDataCount, 0);

    // ! 업로드 로직
    const [dateTimeData, setDateTimeData] = useState(); // 전체 업로드 시 사업장,적부 카운트
    const [fileData, setFileData] = useState(null); // 유료가입신청 업로드 파일
    const [uploadValData, setUploadValData] = useState({
        // 유료가입신청 업로드 하기 데이터
        requestType: 'create',
        data: [],
    });
    // useMutation 훅을 이용하여 파일 업로드를 서버로 요청하는 함수 생성
    const [uploadDataCount, setUploadDataCount] = useState();
    // 엑셀 업로드
    const { handleUpload } = useExcelUpload(
        setUploadValData,
        setCusUploadData,
        setUploadDataCount
    );
    // 부적합 사유 함수 onChange
    const { unsuitableOnChange, unsuitableValue } = useUnsuitableOnChange(
        setUploadValData,
        uploadValData
    );
    // 유료가입신청 결과 업데이트 데이터 카운트 확인
    const { validateUpload } = useExcelResultDataCount(
        requestPaidDataLoad,
        setDateTimeData,
        uploadValData
    );
    const uploadRefetch = () => {
        onRefetch(['customerPaidManagement']);
    };
    const toastMessage = '가입 심사 결과가 업로드되었어요';
    // 업로드 하기
    const { examinationResult } = useResultUpdate(
        requestPaidUpdate,
        setCusUploadData,
        setFileData,
        setIsUpload,
        uploadValData,
        uploadRefetch,
        toastMessage
    );

    // ! 초기 리스트 렌더링 항목
    const columns = [
        {
            title: '신청일',
            width: 80,
            render: ({ requestDateTime }) => (
                <Text size={'xxxs'} color={'G_300'} weight={400}>
                    {viewDay(requestDateTime)}
                </Text>
            ),
        },
        {
            title: '사업장명',
            render: ({ stieName, siteID, status, subscribeID }) => (
                <Button.Text
                    to={
                        status !== 2
                            ? CUSTOMER_PAID_MANAGEMENT_DETAIL_COMPANY(
                                  siteID,
                                  subscribeID
                              )
                            : null
                    }
                    size={'md'}
                    $Theme={'grayScale'}>
                    {stieName}
                </Button.Text>
            ),
        },
        {
            title: '신청 요금제',
            width: 120,
            render: ({ planName }) =>
                planName ? (
                    <Badge
                        color={'P_60'}
                        txtColor={'P_500'}
                        fontSize={12}
                        size={24}>
                        {planName}
                    </Badge>
                ) : null,
        },
        {
            title: '근로자 수',
            width: 53,
            fontSize: 14,
            render: ({ workerCount }) => (
                <Text size={'xxxs'} color={'G_600'} weight={400}>
                    {workerCount}
                </Text>
            ),
        },
        {
            title: '사업자 등록번호',
            width: 100,
            render: ({ corpRegNumber }) => (
                <Text size={'xxxs'} color={'G_600'} weight={400}>
                    {corpRegNumber}
                </Text>
            ),
        },
        {
            title: '서비스 등록번호',
            width: 100,
            leftBorder: true,
            render: ({ siteCode }) => (
                <Text size={'xxxs'} color={'G_600'} weight={400}>
                    {siteCode}
                </Text>
            ),
        },
        {
            title: '담당자',
            width: 140,
            render: ({
                adminUserName, //담당자
                siteAssoTeamName, //소속
                siteAssoTeamID,
                siteOrgTeamName, //조직
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
            title: '진행 현황',
            width: 148,
            leftBorder: true,
            render: ({ status }) => {
                const { color, title } = paidManagementStatus(
                    String(status)
                );
                return (
                    <Text.Point
                        size={14}
                        weight={400}
                        color={color || 'G_600'}>
                        {title}
                    </Text.Point>
                );
            },
        },
    ];

    // ! 파일첨부 업로드하고 렌더링 항목
    const uploadColumns = [
        {
            title: '신청일',
            width: 80,
            render: ({ requestDate }) => (
                <Text size={'xxxs'} color={'G_300'} weight={400}>
                    {requestDate}
                </Text>
            ),
        },
        {
            title: '사업장명',
            width: 580,
            render: ({ realSiteName }) => (
                <Text size={'xxs'} color={'G_700'}>
                    {realSiteName}
                </Text>
            ),
        },
        {
            title: '사업자 등록번호',
            width: 100,
            render: ({ corpRegNumber }) => (
                <Text size={'xxxs'} color={'G_600'} weight={400}>
                    {corpRegNumber}
                </Text>
            ),
        },
        {
            title: '결과',
            width: 40,
            leftBorder: true,
            fontSize: 14,
            dynamicWidth: ({ result, currentStatus }) => {
                return result === '부적합' && currentStatus === 5
                    ? 40
                    : 291;
            },
            render: ({
                result,
                currentStatus,
                subscribeID,
                isMatched,
            }) => (
                <Text
                    size={'xxxs'}
                    weight={400}
                    status={
                        (result === '완료' && currentStatus === 5) ||
                        (result === '부적합' && currentStatus === 5)
                            ? null
                            : 'warning'
                    }
                    color={
                        result === '완료' && currentStatus === 5
                            ? 'Success_500'
                            : result === '부적합' && currentStatus === 5
                            ? 'Error_500'
                            : ''
                    }>
                    {uploadStatus(
                        result,
                        currentStatus,
                        subscribeID,
                        isMatched,
                        'paid'
                    )}
                </Text>
            ),
        },
        {
            title: '부적합 사유',
            width: 400,
            fontSize: 14,
            onHide: ({ result, currentStatus }) => {
                /** 결과 값이 업로드, 변경 신청 취소, 해지된 사업장 일 경우 column hide true: hide false: view*/
                if (result === '부적합' && currentStatus === 5) {
                    return false;
                } else {
                    return true;
                }
            },
            render: ({ siteID, subscribeID }) => (
                <InputComponent
                    type='text'
                    placeholder='부적합 사유를 입력하세요'
                    onChange={(e) =>
                        unsuitableOnChange(
                            siteID,
                            e.target.value,
                            subscribeID
                        )
                    }
                    value={unsuitableValue(siteID, subscribeID)}
                />
            ),
        },
    ];

    return {
        customerData,
        columns,
        uploadColumns,
        checked,
        filter,

        excelDownModal, //다운로드 모달 띄우기
        excelDataCount, //다운로드 전 카운트 세기
        excelDataCountFunc, //다운로드 전 카운트
        excelDownFunc, //엑셀다운로드

        isUpload,
        setIsUpload,
        fileData,
        setFileData,
        handleUpload,
        cusUploadData,
        setCusUploadData,
        validateUpload,
        dateTimeData,
        examinationResult,
        customerDataCount,
        uploadDataCount,

        isTopMaster,
        isAssign,
        onCloseAssign,
        selectAssign,
        setSelectAssign,
        assosiateID,
        onSaveAssign,

        isLoading,
    };
};

export default useCustomerPaidManagement;
