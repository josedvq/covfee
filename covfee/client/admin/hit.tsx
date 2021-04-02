import * as React from 'react'
import { withRouter } from 'react-router'

import { LoadingOutlined } from '@ant-design/icons'

import Constants from 'Constants'
import { fetcher, myerror, throwBadResponse } from '../utils'

class InstanceList extends React.Component {
    render() {
        const data = this.props.instances.map((instance, index) => {
            return {
                key: instance.id,
                id: instance.id,
                type: instance.type,
                instances: instance.instances.length,
                submitted: instance.submitted
            }
        })

        const columns: ColumnsType<any> = [
            {
                title: 'ID',
                dataIndex: 'id',
                render: id => <Link to={'/hits/' + id}>{id}</Link>
            },
            {
                title: 'Type',
                dataIndex: 'type',
                defaultSortOrder: 'descend',
                sorter: (a, b) => a.firstname.localeCompare(b.firstname),
            },
            {
                title: 'Instances',
                dataIndex: 'instances',
                defaultSortOrder: 'descend',
                sorter: (a, b) => a - b
            },
            {
                title: 'Submitted',
                dataIndex: 'submitted',
                defaultSortOrder: 'descend',
                sorter: (a, b) => a.firstname.localeCompare(b.firstname),
            }
        ]

        return <Table dataSource={data} columns={columns} />
    }
}


class AdminHIT extends React.Component {

    state = {
        status: 'loading'
    }

    id: string
    url: string

    constructor(props) {
        super(props)
        this.id = props.match.params.hitId
        this.url = Constants.api_url + '/hits/' + this.id
    }

    componentDidMount() {
        // fetch projects
        const url = this.url + '?' + new URLSearchParams({
            with_instances: '1',
            
        })

        fetcher(url)
            .then(throwBadResponse)
            .then((hit) => {
                
            })
            .catch(error => {
                myerror('error loading projects', error)
            })
    }

    render() {
        switch (this.state.status) {
            case 'loading':
                return <div className={'site-layout-content'}>
                    <LoadingOutlined />
                </div>
            
            case 'ready':
                
            default:
                return <></>
        }
    }
}

const HITWithRouter = withRouter(AdminHIT)

export {InstanceList}
export default HITWithRouter