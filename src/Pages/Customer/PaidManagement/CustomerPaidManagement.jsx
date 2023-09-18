import React, { useState } from 'react';
import { Grid, Icon, Text } from '$atoms';
import { Modal } from '$organisms';
import { PotinText } from 'src/Common/UI/atoms/Text/styled.Text';
import useCustomerPaidManagement from './useCustomerPaidManagement';
import CustomerUploadForm from '$page/Customer/Components/CustomerUploadForm';
import CustomerChangeForm from '../Change/Components/CustomerChangeForm';
import AffiliationModal from '$page/Modal/Customer/AffiliationModal';
import ModalForcePlan from './Components/ModalForcePlan';

const CustomerPaidManagement = () => {
    const {
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

        isTopMaster,
        isAssign,
        onCloseAssign,
        selectAssign,
        setSelectAssign,
        assosiateID,
        onSaveAssign,

        isLoading,
    } = useCustomerPaidManagement();

    const handleFileUpload = (e) => {
        setFileData(e.target.files[0]);
        handleUpload(e.target.files);
    };

    const [isForcePlan, setIsForcePlan] = useState(false);
    const { selectedItems } = checked;

    const isPlanAccess = selectedItems.filter(
        (i) => i.status === 7 || i.status === 2
    ).length;
    const subscribeIDs = selectedItems.map((item) => item.subscribeID);

    return (
        <Grid column={['1560rem']} fill align={'center'}>
            {/* 다운로드 모달 */}
            <Modal.Info
                isActive={excelDownModal?.isActive}
                successText={'다운로드'}
                onSuccess={
                    excelDataCount !== 0 ? () => excelDownFunc() : false
                }
                onClose={() => excelDownModal.onClose()}
                title={'유료 가입 신청서를 다운로드할까요?'}
                text={
                    <Text color={'G_800'} size={16} weight={500}>
                        ‘유료 가입 신청서
                        <PotinText color={'P_500'}>
                            {' '}
                            {excelDataCount}건{' '}
                        </PotinText>
                        이 다운로드됩니다’
                    </Text>
                }>
                <Text color={'G_500'} size={14}>
                    서류 심사를 통과한 가입 신청서만 다운로드되며
                    <br />
                    서류 및 청구 프로세스 심사에서 부적합 처리된 신청서는
                    다운로드 되지 않아요
                </Text>
            </Modal.Info>

            {/* 초기리스트 : 업로드파일첨부 뷰 부분 */}
            {isUpload ? (
                <CustomerUploadForm
                    columns={uploadColumns}
                    cusUploadData={cusUploadData}
                    setIsUpload={setIsUpload}
                    isUpload={isUpload}
                    setFileData={setFileData}
                    fileData={fileData}
                    handleFileUpload={handleFileUpload}
                    setCusUploadData={setCusUploadData}
                    validateUpload={validateUpload}
                    dateTimeData={dateTimeData}
                    uploadDataCount={cusUploadData?.dataCount}
                    examinationResult={examinationResult}
                    title={'심사 결과 업로드'}
                />
            ) : (
                <CustomerChangeForm
                    checked={isTopMaster ? checked : false}
                    columns={columns}
                    isLoading={isLoading}
                    customerData={
                        isTopMaster
                            ? customerData?.map((i) => ({
                                  ...i,
                                  id: i?.subscribeID,
                              }))
                            : customerData
                    }
                    floating={[
                        {
                            icon: <Icon.Pig />,
                            title: '강제 유료 플랜 적용',
                            onClick: () => setIsForcePlan(true),
                            disabled: isPlanAccess,
                        },
                    ]}
                    setIsUpload={setIsUpload}
                    isUpload={isUpload}
                    filter={filter}
                    excelDataCountFunc={excelDataCountFunc}
                    totalCount={customerDataCount}
                    excelDownModal={excelDownModal}
                />
            )}

            {/* AM일때 유료플랜 강제적용 */}
            <ModalForcePlan
                isActive={isForcePlan}
                subscribeIDs={[...subscribeIDs]}
                onClose={() => setIsForcePlan(false)}
                successFn={() => checked.resetChecked()}
            />

            {/* 소속/담당 지정 모달 */}
            <Modal.SelectTeam
                isActive={isAssign.team}
                onClose={onCloseAssign}
                onSuccess={([team]) => setSelectAssign({ ...team })}
                defaultSelected={isAssign.siteAssoTeamID}
            />
            <Modal.SelectUser
                isActive={isAssign.user}
                onClose={onCloseAssign}
                teamID={assosiateID}
                onSuccess={([user]) => setSelectAssign({ ...user })}
            />
            <AffiliationModal
                count={isAssign.siteIDs.length}
                type={isAssign.team ? 'affiliation' : 'representative'}
                isActive={!!selectAssign?.id && !!isAssign.siteIDs.length}
                onClose={() => setSelectAssign(null)}
                data={selectAssign}
                onSuccess={() =>
                    onSaveAssign({
                        isTeam: isAssign.team === true,
                        id: selectAssign?.id,
                        siteIDs: isAssign.siteIDs,
                    })
                }
            />
        </Grid>
    );
};

export default CustomerPaidManagement;
