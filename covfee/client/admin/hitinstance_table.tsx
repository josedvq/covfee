import Constants from 'Constants'
import { myerror, fetcher, throwBadResponse} from '../utils'

import * as React from 'react'
import { ColumnsType } from 'antd/es/table'
import { LoadingOutlined, RightOutlined } from '@ant-design/icons'
import { Table } from 'antd'
import { getHit } from '../models/Hit'
import { HitType } from '../types/hit'

interface Props {
    id: number
}

const InstanceListAsync = (props: Props) => {
    const [loading, setLoading] = React.useState(true)

    const hit: HitType = null
    
    React.useEffect(() => {
        getHit(props.id)
            .then((hit) => {
                this.hit = hit
                setLoading(_=>false)
            })
            .catch(error => {
                myerror('Error loading instances.', error)
            })
    }, [])

    if(loading)
        return <div style={{textAlign: 'center'}}><LoadingOutlined /></div>
    else
        return <InstanceList instances={this.hit.instances} />
}

class InstanceList extends React.Component {

    

    render() {

        const data = this.props.instances.map((instance, index) => {
            return {
                key: instance.id,
                id: instance.id,
                tasks: Object.keys(instance.tasks).length,
                url: Constants.api_url + '/instances/' + instance.id
            }
        })

        const columns: ColumnsType<any> = [
            {
                title: 'ID',
                dataIndex: 'id',
                render: id => <a href={Constants.app_url + '/hits/' + id} target="blank"><RightOutlined /> {id.substring(0, 16)}</a>
            },
            {
                title: 'Tasks',
                dataIndex: 'tasks',
                defaultSortOrder: 'descend',
                sorter: (a, b) => a-b,
                render: tasks => 'tasks: '+tasks
            },
            {
                title: 'Data',
                dataIndex: 'url',
                render: url => <>
                    Download: <a onClick={this.getDownloadHandler(url, false)}>JSON</a> | <a onClick={this.getDownloadHandler(url, true)}>CSV</a>
                </>
            }
        ]

        return <Table 
            dataSource={data} 
            style={{marginLeft: '2em'}}
            columns={columns} 
            size="small" 
            pagination={false} 
            showHeader={false} 
            indentSize={15}/>
    }
}