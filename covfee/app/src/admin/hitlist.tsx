import { Table } from 'antd'
import * as React from 'react'
import { fetcher, myerror, throwBadResponse } from '../utils'
import { InstanceListAsync } from './instancelist'
const Constants = require('Constants')


interface HITListProps {
    hits: Array<HITSpec>
    updateHit: Function
}

export class HITList extends React.Component<HITListProps> {

    setInstances = (hitIndex: number, instances) => {
        this.props.updateHit(hitIndex, {
            ...this.props.hits[hitIndex],
            instances: instances
        })
    }

    handleAddInstance = (hitIndex: number) => {
        
        const url = Constants.api_url + '/hits/' + this.props.hits[hitIndex].id + '/add_instances'

        fetcher(url)
            .then(throwBadResponse)
            .then((newInstances) => {
                this.props.updateHit(hitIndex, {
                    ...this.props.hits[hitIndex],
                    instances: [
                        ...this.props.hits[hitIndex].instances,
                        ...newInstances
                    ]
                })
            })
            .catch(error => {
                myerror('Error adding hit. Please retry. Refresh the page if the error persists.', error)
            })

        
    }

    render() {
        const data = this.props.hits.map((hit, index) => {
            return {
                key: index,
                id: hit.id,
                type: hit.type,
                name: hit.name,
                instances: hit.instances,
                submitted: hit.submitted
            }
        })

        const columns: ColumnsType<any> = [
            {
                title: 'HIT',
                dataIndex: 'name',
                defaultSortOrder: 'descend',
                sorter: (a, b) => a.toString().localeCompare(b.toString()),
            },
            {
                title: 'Type',
                dataIndex: 'type',
                defaultSortOrder: 'descend',
                sorter: (a, b) => a.toString().localeCompare(b.toString()),
            },
            {
                title: 'Instances',
                dataIndex: 'instances',
                defaultSortOrder: 'descend',
                sorter: (a, b) => a - b,
                render: (instances: number, hit) => <>
                    {instances.length} (<a onClick={()=>{this.handleAddInstance(hit.key)}}>add</a>)
                </>
            },
            {
                title: 'Submitted',
                dataIndex: 'submitted',
                defaultSortOrder: 'descend',
                sorter: (a, b) => a.toString().localeCompare(b.toString()),
            }
        ]

        return <Table dataSource={data} columns={columns} size="small" pagination={false} expandable={{
            expandedRowRender: record => <InstanceListAsync 
                hitKey={record.key}
                hitId={record.id}
                instances={record.instances}
                setInstances={this.setInstances}/>,
            rowExpandable: record => true,
        }} />
    }
}