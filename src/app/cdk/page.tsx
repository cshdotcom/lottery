'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Key, CheckCircle2, XCircle, Clock, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

interface CdkValidation {
  valid: boolean;
  name?: string;
  description?: string;
  remainingUses?: number;
  error?: string;
}

export default function CdkPage() {
  const [cdk, setCdk] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<CdkValidation | null>(null);

  async function checkCdk() {
    if (!cdk.trim()) {
      toast.error('请输入CDK');
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const response = await fetch(`/api/cdk/validate?code=${encodeURIComponent(cdk.trim())}`);
      const data = await response.json();

      setValidationResult(data);

      if (data.valid) {
        toast.success('CDK有效');
      } else {
        toast.error(data.error || 'CDK无效');
      }
    } catch (error) {
      toast.error('验证失败，请重试');
      setValidationResult({ valid: false, error: '网络错误，请重试' });
    } finally {
      setIsValidating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Key className="h-8 w-8" />
            CDK 验证
          </h1>
          <p className="text-muted-foreground mt-2">输入兑换码验证有效性</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>验证 CDK</CardTitle>
            <CardDescription>输入您的兑换码进行检查</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={cdk}
                onChange={(e) => setCdk(e.target.value.toUpperCase())}
                placeholder="输入CDK (如: LOT-XXXXXXXX)"
                className="font-mono text-lg"
                onKeyDown={(e) => e.key === 'Enter' && checkCdk()}
              />
              <Button onClick={checkCdk} disabled={isValidating} className="px-6">
                {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : '验证'}
              </Button>
            </div>

            {validationResult && (
              <div className={`p-4 rounded-lg border ${
                validationResult.valid 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                {validationResult.valid ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-6 w-6" />
                      <span className="font-semibold text-lg">CDK有效</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">CDK名称:</span>
                        <span className="font-medium">{validationResult.name || '未命名'}</span>
                      </div>
                      {validationResult.description && (
                        <div>
                          <span className="text-sm text-muted-foreground">描述:</span>
                          <p className="text-sm mt-1 bg-white/50 p-2 rounded">{validationResult.description}</p>
                        </div>
                      )}
                      {validationResult.remainingUses !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">剩余次数:</span>
                          <Badge variant={validationResult.remainingUses > 0 ? 'default' : 'destructive'}>
                            {validationResult.remainingUses} 次
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-6 w-6" />
                    <span className="font-semibold text-lg">{validationResult.error || 'CDK无效'}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              使用说明
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <Key className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <span><strong>CDK格式：</strong>一般为 LOT-XXXXXXXX 格式，区分大小写</span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <span><strong>使用次数：</strong>每个CDK有使用次数限制，用完即失效</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <span><strong>有效期：</strong>部分CDK有过期时间，请在有效期内使用</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <span><strong>验证结果：</strong>绿色表示有效，红色表示无效或已过期</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-700 flex items-center gap-2 text-lg">
              <Info className="h-5 w-5" />
              常见问题
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-blue-800">
            <div>
              <p className="font-medium">Q: CDK显示有效但无法使用？</p>
              <p className="text-blue-600 mt-1">A: 可能已被他人使用，或已达到最大使用次数</p>
            </div>
            <div>
              <p className="font-medium">Q: CDK显示已过期？</p>
              <p className="text-blue-600 mt-1">A: 该CDK已超过有效期，无法再使用</p>
            </div>
            <div>
              <p className="font-medium">Q: 输入CDK显示不存在？</p>
              <p className="text-blue-600 mt-1">A: 请检查CDK是否输入正确，区分大小写</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
