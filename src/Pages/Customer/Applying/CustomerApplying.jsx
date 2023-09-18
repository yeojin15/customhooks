import React, { useEffect, useState } from 'react';
import { Grid } from '$atoms';
import { Form, Modal } from '$organisms';
import { TableForm } from '$tamplate';
import useCustomerApplying from './useCustomerApplying';
import AffiliationModal from '$page/Modal/Customer/AffiliationModal';
import ModalDeleteWritingApplication from './Components/ModalDeleteWritingApplication';

const CustomerApplying = () => {
    const {
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
    } = useCustomerApplying();

    const [isDelete, setIsDelete] = useState(false);
    const selectIDs = checked.selected;
    const [subscribeIDs, setSubscribeIDs] = useState([]);

    /** 체크된 siteID의 subscribeID 값 */
    const getSubscribeIDs = (selectIDs, applying) => {
        return selectIDs
            .map((siteID) => {
                const checkedData = applying.find(
                    (data) => data.siteID === siteID
                );
                return checkedData ? checkedData.subscribeID : null;
            })
            .filter(Boolean);
    };
    useEffect(() => {
        const subscribeIDs = getSubscribeIDs(selectIDs, applying);
        setSubscribeIDs(subscribeIDs);
    }, [selectIDs, applying]);

    return (
        <Grid column={['1560rem']} fill align={'center'}>
            <Form fill padding={[40, 60, 0]}>
                <TableForm
                    {...checked}
                    totalCount={customerDataCount}
                    filter={filter}
                    columns={columns}
                    data={applying?.map((i) => ({
                        ...i,
                        id: i?.siteID,
                    }))}
                    isLoading={isLoading}
                    floating={[
                        {
                            type: 'delete',
                            title: '작성 중인 신청서 삭제',
                            onClick: () => setIsDelete(true),
                        },
                    ]}
                />
            </Form>

            {/* 작성중 신청서 삭제 모달 */}
            <ModalDeleteWritingApplication
                isActive={isDelete}
                ids={[...subscribeIDs]}
                onClose={() => setIsDelete(false)}
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

export default CustomerApplying;
