'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, History, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface LotteryRecord {
  id: string;
  topicId: string;
  topicUrl: string;
  topicTitle: string;
  author: string;
  winnersCount: number;
  winners: string;
  seed: string;
  totalParticipants: number;
  posted: boolean;
  postUrl?: string;
  createdAt: string;
}

export default function LotteryRecordsPage() {
  const [records, setRecords] = useState<LotteryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchRecords();
  }, [page]);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/lottery-records?limit=${limit}&offset=${page * limit}`);
      const data = await response.json();
      setRecords(data.records || []);
      setTotal(data.total || 0);
    } catch (error) {
      toast.error('获取记录失败');
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <History className="h-8 w-8" />
              抽奖记录
            </h1>
            <p className="text-muted-foreground mt-1">查看历史抽奖记录</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              抽奖记录列表
            </CardTitle>
            <CardDescription>
              共 {total} 条记录
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>帖子标题</TableHead>
                      <TableHead>作者</TableHead>
                      <TableHead>中奖人数</TableHead>
                      <TableHead>参与楼层</TableHead>
                      <TableHead>发帖状态</TableHead>
                      <TableHead>抽奖时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium max-w-xs truncate">
                          {record.topicTitle}
                        </TableCell>
                        <TableCell>{record.author}</TableCell>
                        <TableCell>{record.winnersCount}</TableCell>
                        <TableCell>{record.totalParticipants}</TableCell>
                        <TableCell>
                          {record.posted ? (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              已发帖
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="mr-1 h-3 w-3" />
                              未发帖
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(record.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" asChild>
                              <a href={record.topicUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                            {record.posted && record.postUrl && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={record.postUrl} target="_blank" rel="noopener noreferrer">
                                  查看结果帖
                                </a>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {records.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          暂无抽奖记录
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      显示 {page * limit + 1} - {Math.min((page + 1) * limit, total)} 条，共 {total} 条
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => p - 1)}
                        disabled={page === 0}
                      >
                        上一页
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => p + 1)}
                        disabled={page >= totalPages - 1}
                      >
                        下一页
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
